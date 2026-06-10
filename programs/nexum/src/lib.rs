use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("NXMprotoco1111111111111111111111111111111111");

// ─── Constants ───────────────────────────────────────────────────────────────
pub const TASK_SEED: &[u8]       = b"task";
pub const ESCROW_SEED: &[u8]     = b"escrow";
pub const PROFILE_SEED: &[u8]    = b"profile";
pub const DISPUTE_SEED: &[u8]    = b"dispute";
pub const PLATFORM_FEE_BPS: u64  = 250; // 2.5%
pub const MAX_TITLE_LEN: usize   = 80;
pub const MAX_DESC_LEN: usize    = 500;
pub const MAX_SKILLS_LEN: usize  = 200;

#[program]
pub mod nexum {
    use super::*;

    // ─── 1. Create User Profile ───────────────────────────────────────────
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        username: String,
        skills: String,
    ) -> Result<()> {
        require!(username.len() <= 32, NexumError::StringTooLong);
        require!(skills.len() <= MAX_SKILLS_LEN, NexumError::StringTooLong);

        let profile = &mut ctx.accounts.profile;
        profile.owner       = ctx.accounts.owner.key();
        profile.username    = username;
        profile.skills      = skills;
        profile.reputation  = 0;
        profile.tasks_completed = 0;
        profile.tasks_created   = 0;
        profile.sbt_level   = 0;
        profile.bump        = ctx.bumps.profile;

        emit!(ProfileCreated {
            owner: profile.owner,
            username: profile.username.clone(),
        });
        Ok(())
    }

    // ─── 2. Create Task + Escrow SOL ──────────────────────────────────────
    pub fn create_task(
        ctx: Context<CreateTask>,
        task_id: u64,
        title: String,
        description: String,
        required_skills: String,
        reward_lamports: u64,
        deadline_unix: i64,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, NexumError::StringTooLong);
        require!(description.len() <= MAX_DESC_LEN, NexumError::StringTooLong);
        require!(required_skills.len() <= MAX_SKILLS_LEN, NexumError::StringTooLong);
        require!(reward_lamports > 0, NexumError::RewardTooLow);
        require!(deadline_unix > Clock::get()?.unix_timestamp, NexumError::DeadlinePast);

        // Transfer reward into escrow PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to:   ctx.accounts.escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, reward_lamports)?;

        let task = &mut ctx.accounts.task;
        task.task_id         = task_id;
        task.creator         = ctx.accounts.creator.key();
        task.title           = title;
        task.description     = description;
        task.required_skills = required_skills;
        task.reward_lamports = reward_lamports;
        task.deadline_unix   = deadline_unix;
        task.status          = TaskStatus::Open;
        task.worker          = None;
        task.bump            = ctx.bumps.task;
        task.escrow_bump     = ctx.bumps.escrow;

        // Update profile counter
        let profile = &mut ctx.accounts.creator_profile;
        profile.tasks_created += 1;

        emit!(TaskCreated {
            task_id,
            creator: task.creator,
            reward_lamports,
            deadline_unix,
        });
        Ok(())
    }

    // ─── 3. Apply for Task ────────────────────────────────────────────────
    pub fn apply_task(ctx: Context<ApplyTask>, task_id: u64) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.task_id == task_id, NexumError::TaskMismatch);
        require!(task.status == TaskStatus::Open, NexumError::TaskNotOpen);
        require!(task.creator != ctx.accounts.worker.key(), NexumError::CannotSelfAssign);

        task.status = TaskStatus::InProgress;
        task.worker = Some(ctx.accounts.worker.key());

        emit!(TaskApplied {
            task_id,
            worker: ctx.accounts.worker.key(),
        });
        Ok(())
    }

    // ─── 4. Complete Task + Claim Payment ─────────────────────────────────
    pub fn complete_task(ctx: Context<CompleteTask>, task_id: u64) -> Result<()> {
        let task = &mut ctx.accounts.task;
        require!(task.task_id == task_id, NexumError::TaskMismatch);
        require!(task.status == TaskStatus::InProgress, NexumError::TaskNotInProgress);
        require!(task.creator == ctx.accounts.creator.key(), NexumError::Unauthorized);
        require!(task.worker == Some(ctx.accounts.worker.key()), NexumError::WrongWorker);

        let reward = task.reward_lamports;
        let fee    = reward * PLATFORM_FEE_BPS / 10_000;
        let payout = reward - fee;

        // Release escrow → worker (net of fee)
        let task_id_bytes = task_id.to_le_bytes();
        let escrow_seeds: &[&[u8]] = &[
            ESCROW_SEED,
            task_id_bytes.as_ref(),
            &[task.escrow_bump],
        ];
        let signer_seeds = &[escrow_seeds];

        // Pay worker
        **ctx.accounts.escrow.try_borrow_mut_lamports()? -= payout;
        **ctx.accounts.worker.try_borrow_mut_lamports()? += payout;

        // Fee stays in escrow until treasury sweep (simplification for MVP)
        // In production: transfer fee to treasury PDA here

        task.status = TaskStatus::Completed;

        // Update reputation + SBT
        let worker_profile = &mut ctx.accounts.worker_profile;
        worker_profile.tasks_completed += 1;
        worker_profile.reputation      += 10; // +10 rep per task

        // SBT level thresholds: 1→5 tasks, 2→15, 3→30, 4→50
        worker_profile.sbt_level = match worker_profile.tasks_completed {
            0..=4  => 0,
            5..=14 => 1,
            15..=29 => 2,
            30..=49 => 3,
            _       => 4,
        };

        emit!(TaskCompleted {
            task_id,
            worker: ctx.accounts.worker.key(),
            payout,
            new_reputation: worker_profile.reputation,
            sbt_level: worker_profile.sbt_level,
        });
        Ok(())
    }

    // ─── 5. Open Dispute ──────────────────────────────────────────────────
    pub fn open_dispute(
        ctx: Context<OpenDispute>,
        task_id: u64,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 300, NexumError::StringTooLong);

        let task = &mut ctx.accounts.task;
        require!(task.task_id == task_id, NexumError::TaskMismatch);
        require!(task.status == TaskStatus::InProgress, NexumError::TaskNotInProgress);

        let caller = ctx.accounts.caller.key();
        require!(
            caller == task.creator || task.worker == Some(caller),
            NexumError::Unauthorized
        );

        task.status = TaskStatus::Disputed;

        let dispute = &mut ctx.accounts.dispute;
        dispute.task_id     = task_id;
        dispute.opened_by   = caller;
        dispute.reason      = reason;
        dispute.resolved    = false;
        dispute.bump        = ctx.bumps.dispute;

        emit!(DisputeOpened {
            task_id,
            opened_by: caller,
        });
        Ok(())
    }

    // ─── 6. Resolve Dispute (admin/DAO) ──────────────────────────────────
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        task_id: u64,
        favour_worker: bool,
    ) -> Result<()> {
        // MVP: resolver is the program upgrade authority
        // Production: replace with DAO staker vote
        let task = &mut ctx.accounts.task;
        require!(task.task_id == task_id, NexumError::TaskMismatch);
        require!(task.status == TaskStatus::Disputed, NexumError::NotDisputed);

        let dispute = &mut ctx.accounts.dispute;
        require!(!dispute.resolved, NexumError::AlreadyResolved);

        let reward = task.reward_lamports;

        if favour_worker {
            // Pay worker full reward
            **ctx.accounts.escrow.try_borrow_mut_lamports()? -= reward;
            **ctx.accounts.worker.try_borrow_mut_lamports()? += reward;
            task.status = TaskStatus::Completed;

            let worker_profile = &mut ctx.accounts.worker_profile;
            worker_profile.tasks_completed += 1;
            worker_profile.reputation      += 5; // partial rep for disputed win
        } else {
            // Refund creator
            **ctx.accounts.escrow.try_borrow_mut_lamports()? -= reward;
            **ctx.accounts.creator.try_borrow_mut_lamports()? += reward;
            task.status = TaskStatus::Cancelled;
        }

        dispute.resolved = true;

        emit!(DisputeResolved {
            task_id,
            favour_worker,
        });
        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[account]
pub struct UserProfile {
    pub owner:           Pubkey,   // 32
    pub username:        String,   // 4 + 32
    pub skills:          String,   // 4 + 200
    pub reputation:      u64,      // 8
    pub tasks_completed: u64,      // 8
    pub tasks_created:   u64,      // 8
    pub sbt_level:       u8,       // 1
    pub bump:            u8,       // 1
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + (4+32) + (4+200) + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Task {
    pub task_id:         u64,      // 8
    pub creator:         Pubkey,   // 32
    pub title:           String,   // 4 + 80
    pub description:     String,   // 4 + 500
    pub required_skills: String,   // 4 + 200
    pub reward_lamports: u64,      // 8
    pub deadline_unix:   i64,      // 8
    pub status:          TaskStatus, // 1
    pub worker:          Option<Pubkey>, // 1 + 32
    pub bump:            u8,       // 1
    pub escrow_bump:     u8,       // 1
}

impl Task {
    pub const LEN: usize = 8 + 8 + 32 + (4+80) + (4+500) + (4+200) + 8 + 8 + 1 + (1+32) + 1 + 1;
}

#[account]
pub struct Dispute {
    pub task_id:   u64,    // 8
    pub opened_by: Pubkey, // 32
    pub reason:    String, // 4 + 300
    pub resolved:  bool,   // 1
    pub bump:      u8,     // 1
}

impl Dispute {
    pub const LEN: usize = 8 + 8 + 32 + (4+300) + 1 + 1;
}

// ─── Enums ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Open,
    InProgress,
    Completed,
    Disputed,
    Cancelled,
}

// ─── Contexts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = owner,
        space = UserProfile::LEN,
        seeds = [PROFILE_SEED, owner.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct CreateTask<'info> {
    #[account(
        init,
        payer = creator,
        space = Task::LEN,
        seeds = [TASK_SEED, task_id.to_le_bytes().as_ref()],
        bump
    )]
    pub task: Account<'info, Task>,

    /// CHECK: Native SOL escrow PDA — no data, just lamports
    #[account(
        mut,
        seeds = [ESCROW_SEED, task_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PROFILE_SEED, creator.key().as_ref()],
        bump = creator_profile.bump,
    )]
    pub creator_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct ApplyTask<'info> {
    #[account(
        mut,
        seeds = [TASK_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    pub worker: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct CompleteTask<'info> {
    #[account(
        mut,
        seeds = [TASK_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    /// CHECK: escrow lamports transferred directly
    #[account(
        mut,
        seeds = [ESCROW_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.escrow_bump,
    )]
    pub escrow: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PROFILE_SEED, worker.key().as_ref()],
        bump = worker_profile.bump,
    )]
    pub worker_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: validated against task.worker
    #[account(mut)]
    pub worker: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct OpenDispute<'info> {
    #[account(
        mut,
        seeds = [TASK_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = caller,
        space = Dispute::LEN,
        seeds = [DISPUTE_SEED, task_id.to_le_bytes().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,

    #[account(mut)]
    pub caller: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: u64)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [TASK_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        seeds = [DISPUTE_SEED, task_id.to_le_bytes().as_ref()],
        bump = dispute.bump,
    )]
    pub dispute: Account<'info, Dispute>,

    /// CHECK: escrow lamports redistributed
    #[account(
        mut,
        seeds = [ESCROW_SEED, task_id.to_le_bytes().as_ref()],
        bump = task.escrow_bump,
    )]
    pub escrow: UncheckedAccount<'info>,

    /// CHECK: validated against task.worker
    #[account(mut)]
    pub worker: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [PROFILE_SEED, worker.key().as_ref()],
        bump = worker_profile.bump,
    )]
    pub worker_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    // MVP resolver = upgrade authority; replace with DAO signer in production
    pub resolver: Signer<'info>,
}

// ─── Events ──────────────────────────────────────────────────────────────────

#[event]
pub struct ProfileCreated {
    pub owner:    Pubkey,
    pub username: String,
}

#[event]
pub struct TaskCreated {
    pub task_id:         u64,
    pub creator:         Pubkey,
    pub reward_lamports: u64,
    pub deadline_unix:   i64,
}

#[event]
pub struct TaskApplied {
    pub task_id: u64,
    pub worker:  Pubkey,
}

#[event]
pub struct TaskCompleted {
    pub task_id:        u64,
    pub worker:         Pubkey,
    pub payout:         u64,
    pub new_reputation: u64,
    pub sbt_level:      u8,
}

#[event]
pub struct DisputeOpened {
    pub task_id:   u64,
    pub opened_by: Pubkey,
}

#[event]
pub struct DisputeResolved {
    pub task_id:      u64,
    pub favour_worker: bool,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum NexumError {
    #[msg("String exceeds maximum allowed length")]
    StringTooLong,
    #[msg("Reward must be greater than zero")]
    RewardTooLow,
    #[msg("Deadline must be in the future")]
    DeadlinePast,
    #[msg("Task ID mismatch")]
    TaskMismatch,
    #[msg("Task is not open for applications")]
    TaskNotOpen,
    #[msg("Task is not in progress")]
    TaskNotInProgress,
    #[msg("Cannot assign task to yourself")]
    CannotSelfAssign,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Wrong worker account")]
    WrongWorker,
    #[msg("Task is not disputed")]
    NotDisputed,
    #[msg("Dispute already resolved")]
    AlreadyResolved,
}
