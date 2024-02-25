# sRFC 17 Recommendation

### Field-based Authority

- Create the ability to add and remove extra authorities for specific fields
- These authorities can be signer keys or PDAs which enable programmability
- Instructions
  - `add_field_authority`
  - `remove_field_authority`
- Accounts
  - ...
- Implementation
  - Similar to Holder Metadata, create PDAs with the field and authority as seeds
  - We could also create a designated account so that these authorities are discoverable
- These authority programs can have their own interfaces, the idea is to expand functionality without endless copies of the same program
