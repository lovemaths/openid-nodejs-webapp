var base64url = require('base64url');

var pair = {
  'alg': 'id_token_alg_none',
  'iss1': 'id_token_missing_iss',
  'iss2': 'id_token_invalid_iss',
  'aud1': 'id_token_missing_aud',
  'aud2': 'id_token_invalid_aud',
  'exp1': 'id_token_missing_exp',
  'exp2': 'id_token_expired',
  'iat': 'id_token_missing_iat',
  'nonce1': 'id_token_missing_nonce',
  'nonce2': 'id_token_invalid_nonce',
  'azp1': 'id_token_multiple_aud_no_azp',
  'azp2': 'id_token_multiple_aud_invalid_azp',
  'nbf': 'id_token_future_nbf',
  'sig1': 'id_token_missing_signature',
  'sig2': 'id_token_invalid_signature',
  'at_hash1': 'id_token_missing_at_hash',
  'at_hash2': 'id_token_invalid_at_hash',
  'c_hash1': 'id_token_missing_c_hash',
  'c_hash2': 'id_token_invalid_c_hash',
  'state1': 'auth_response_missing_state',
  'state2': 'auth_response_invalid_state',
  'code1': 'auth_response_missing_code',
  'code2': 'auth_response_invalid_code',
  'id_token_authResp': 'auth_response_missing_id_token',
  'access_token_authResp': 'auth_response_missing_access_token',
  'denied': 'auth_response_access_denied',
  'id_token_tokenResp': 'token_response_missing_id_token',
  'access_token_tokenResp': 'token_response_missing_access_token',
};

var json = "{ \n";

for (var key in pair) {
  var value = pair[key];
  var tParamStr = `\{${value}: true\}`;
  json += `    ${key}: ${base64url.encode(tParamStr)}, \n`;
};

json += "}";

console.log(json);