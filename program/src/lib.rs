use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// Declare the program entrypoint
entrypoint!(process_instruction);

// Program entrypoint implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello World Solana program entrypoint");

    // Log the program ID
    msg!("Program ID: {}", program_id);

    // Iterate through accounts
    let accounts_iter = &mut accounts.iter();
    
    // Get the account that will store the greeting count
    let account = next_account_info(accounts_iter)?;

    // Check that the account is owned by this program
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Check if instruction data was provided
    if !instruction_data.is_empty() {
        let name = String::from_utf8_lossy(instruction_data);
        msg!("Hello, {}!", name);
    } else {
        msg!("Hello, Solana!");
    }

    // Increment and store greeting count
    let mut data = account.try_borrow_mut_data()?;
    
    // Initialize counter if account is empty
    if data.len() < 4 {
        msg!("Account data too small to store counter");
        return Err(ProgramError::InvalidAccountData);
    }

    let mut counter = u32::from_le_bytes(data[0..4].try_into().unwrap());
    counter += 1;
    
    msg!("Greeting count: {}", counter);
    
    // Store the new counter value
    data[0..4].copy_from_slice(&counter.to_le_bytes());

    msg!("Program complete!");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Epoch;

    #[test]
    fn test_hello_world() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; 4];
        let owner = program_id;
        
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let accounts = vec![account];
        let instruction_data = b"Solana Developer";

        let result = process_instruction(&program_id, &accounts, instruction_data);
        assert!(result.is_ok());
    }
}