@data
Feature: Encrypted IBR messages (EncryptedMessage)

When header.is_msg_encrypted is true the message is not an IBR payload but an
EncryptedMessage (JWE-like: header, ciphertext, encrypted_key, tag, iv). The suite
checks that every part of it is present. Runs offline.

  Scenario Outline: An encrypted "<action>" message must be a complete EncryptedMessage
    Given an encrypted "<action>" message
    Then the encrypted message should be valid

    Examples:
      | action             |
      | on-search          |
      | notify             |
      | txn-on-status      |
      | enrollment-updates |

  Scenario Outline: An encrypted message missing "<field>" is rejected
    Given an encrypted "<action>" message
    When its encrypted field "<field>" is removed
    Then the encrypted message should be rejected because of "<error>"

    Examples:
      | action             | field         | error                                             |
      | on-search          | ciphertext    | must have required property 'ciphertext'          |
      | on-search          | encrypted_key | must have required property 'encrypted_key'       |
      | on-search          | tag           | must have required property 'tag'                 |
      | on-search          | iv            | must have required property 'iv'                  |
      | on-search          | header        | /message must have required property 'header'     |
      | on-search          | header.kid    | /message/header must have required property 'kid' |
      | enrollment-updates | ciphertext    | must have required property 'ciphertext'          |
      | enrollment-updates | header.alg    | /message/header must have required property 'alg' |
