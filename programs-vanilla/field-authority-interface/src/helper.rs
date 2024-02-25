//! TODO: Doc

use spl_token_metadata_interface::state::Field;

/// TODO: Doc
pub fn field_to_seed_str(field: Field) -> String {
    match field {
        Field::Name => "name".to_string(),
        Field::Symbol => "symbol".to_string(),
        Field::Uri => "uri".to_string(),
        Field::Key(key) => format!("key:{}", key),
    }
}
