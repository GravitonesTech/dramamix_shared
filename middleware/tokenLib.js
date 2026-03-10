const crypto = require('crypto');
const ALGO = 'sha256';
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const log = async (message, level, source, context, request, response) => {
  try {
    let log = {
      epoc: Math.floor(+new Date()),
      message: message,
      level: level,
      source: source,
      context: context,
      request: JSON.stringify(request),
      response: JSON.stringify(response),
    };
    console.log(log);
  } catch (error) {
    let errorLog = error.stack
      ? error.stack
      : error.message
      ? error.message
      : "";
    console.log("Error in log", "error", "get log", null, null, errorLog);
  }
};

const encrypt = (textString, salt) => {
        const hashedPassword = crypto.createHmac(ALGO, salt)
                .update(textString)
                .digest('hex');
        return hashedPassword;
}

const validateToken = function (token) {
        try {
                const jwk = {
                        "kty": "RSA",
                        "e": "AQAB",
                        "use": "sig",
                        "kid": "IF6ivQOfJtHgHv8BKBOYxZF_LTwRZHj-PldPpMvswyk",
                        "alg": "RS256",
                        "n": "lI1U9zISbdb26sWHEfKG7-LVBzrXYDh40Voq2wTT-a_gzFmEQJMDIIDOxVMNj1U372bKeSzk2gla1p0wJxPkNtR_JGzPnp9rIsA6uRk6k3-l01Rn_zxNK6EE_zoZVZ6N3IGjV-CIwcRGzOL4p9_gdgEuLqOCBbkgtz8Ak3cAcu_EWGZVx2duK4gIJa6hNRKAs9u-SilTPpQTZ_-cHyYmiAGuMQoXAst-j7e5qiDklHwCOsFRbWhiXG115YJw0w80BsXVWbZ4hVjYwgDv0Armsz99A4TzpHrsShw8E5da-digeO9Ae-J2wRkqb8HDTLEg4QKo48m-8wL79NT_uL1ETw"
                };
                const pem = jwkToPem(jwk);
                let decoded = jwt.verify(token, pem, { algorithms: ['RS256'] });
                return decoded;
        } catch (error) {
                return false;
        }
}

const generateToken = (userdata) => {
        try {
                const jwk = {
                        "p": "xBryXJbg1dx50QFXCpzk-raVNsWwJ-Q9tU3uLf4Tc693Md6u8M-erQR2QjRaNfI_tq69Y2MQeQZEmKXKRbhi2plPYB6glEI_nPr61NrdfEzCEz52jdHmqoRFnST_Wovoxxjt1gQUg7v3IKInlszpb49n0uuRdmgI3B2y4y7eMsM",
                        "kty": "RSA",
                        "q": "wexNjM1jCOgHu_DV71vlsLkCwsK1UiHXm9XApV3R3EPXvpYXH2m3kLlMuL59UIWckSb93BHd-5K8xDhdK2E49x7c-hqUAs30pU6jhPzSxXKZuwDOq5Ou7yfz63u-hmS8djVooRe73WTGDrUOORl7-PSPDFw1VcT7Wd5tBrO3N4U",
                        "d": "EQQbbnFi4QgVopDbxveD82iFRF2-G_x8AmcUr5_e9CPsWRwL5SWx3wBCLyIzVG7LiHW6zaSR1lPp_tlkkaVap9kxcyevpJjYOdPRJjC4n_qoMQvjGb57jHrWSrIKAt-1mkOTRVan86IbBg8dsoUXfgzmkFsUYrlxAOyLkVi5SXD23G7NTZHeNEvuwtigImyMBlTI7fUUJb-HWzHxvUPpEIFk8HLOYDc5JJOnYPFbgWXegQHv_wlgbdktCMWos0J_SUeVbgTSoYt-XO3WBevEJ1e2Ri6Sk-_KxeEY8xfsPa-QNWno70NDDOpcWdR2HgqgZLAb-O3xhzKG1NVRWgWYmQ",
                        "e": "AQAB",
                        "use": "sig",
                        "kid": "IF6ivQOfJtHgHv8BKBOYxZF_LTwRZHj-PldPpMvswyk",
                        "qi": "XoLwKMHTfb59tZtM_tKVVy0VgSi6Pfsh2USSNf80tdOc7xH0hjoxCqBr11RHzZBdtwBybzQbNLNzhxuYM6Br00n1zeRpJOUf3Be_OkF0NOugW__RJ2ev9ENywAhZhoYaCNIEhd3NMXCDKHwC24aLE1WF5HNw5_ItyyzSC0zMNa0",
                        "dp": "DHNtieVmdw2dimCcZycY_rYS-TxJ9-5s4JMHGVJ1Z7XvSnJKBy4XdALBg2iRhbVQyEeF7MaAaD62oj58fjq7xAdR29d1-JPQOCZTQKp4v4icFd60ZkK6c38ccGLF97jEWcfCagEuUELh6OeCvfdapuOjAuhD_xGR5m_YSMZUA0M",
                        "alg": "RS256",
                        "dq": "o4gENbKVy1LwArsrjbfvUEIUY-0SPvqu-Ykd9dXSPW8wplWnliPuWqsIWdq5joe96mH5PfYLPjUV3lqxpv1LrolmS7rSCjNoFWblWiZiD4N-xEYAAox9vsvwVCp8FpUooH6VhxOepypuIsToA5rMArspToELsRJ16-k4A6jV3ok",
                        "n": "lI1U9zISbdb26sWHEfKG7-LVBzrXYDh40Voq2wTT-a_gzFmEQJMDIIDOxVMNj1U372bKeSzk2gla1p0wJxPkNtR_JGzPnp9rIsA6uRk6k3-l01Rn_zxNK6EE_zoZVZ6N3IGjV-CIwcRGzOL4p9_gdgEuLqOCBbkgtz8Ak3cAcu_EWGZVx2duK4gIJa6hNRKAs9u-SilTPpQTZ_-cHyYmiAGuMQoXAst-j7e5qiDklHwCOsFRbWhiXG115YJw0w80BsXVWbZ4hVjYwgDv0Armsz99A4TzpHrsShw8E5da-digeO9Ae-J2wRkqb8HDTLEg4QKo48m-8wL79NT_uL1ETw"
                };

                const pem = jwkToPem(jwk, { private: true });
                const token = jwt.sign({ userdata }, pem, { algorithm: "RS256", expiresIn: `${process.env.TOKEN_EXPIRATION || '3600'}s`, });

                return { accessToken: token, expiresIn: process.env.TOKEN_EXPIRATION }
        } catch (error) {
                let errorLog = error.stack ? error.stack : (error.message ? error.message : "");
                console.log("Error calling generate token", "error", "generate token", errorLog);
                throw error;
        }
};

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dramamix-refresh-secret-fallback-change-in-production';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateRefreshToken = (userId) => {
  try {
    const jti = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
      { userId, jti, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { algorithm: 'HS256', expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    return { refreshToken: token, jti, expiresIn: 7 * 24 * 60 * 60 };
  } catch (error) {
    throw error;
  }
};

const validateRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] });
    if (decoded.type !== 'refresh') return false;
    return decoded;
  } catch (error) {
    return false;
  }
};

module.exports = {
        encrypt,
        generateToken,
        validateToken,
        generateRefreshToken,
        validateRefreshToken,
};
