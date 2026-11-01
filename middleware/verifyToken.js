import { createRemoteJWKSet, jwtVerify } from "jose";

let jwks;

// Public keys come from the website's BetterAuth. They are fetched once and cached.
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
    );
  }
  return jwks;
}

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: process.env.CLIENT_URL,
      audience: process.env.CLIENT_URL,
    });

    // From here on, every route knows who is calling
    req.user = { id: payload.id, name: payload.name, email: payload.email };
    next();
  } catch (error) {
    console.error("Token check failed:", error.message);
    res
      .status(401)
      .json({
        message: "Your session is invalid or has expired. Please log in again.",
      });
  }
}
