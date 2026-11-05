import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const header = req.get('authorization') || '';
  const match = /^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(header);
  if (!match) return res.status(401).json({ error: 'Se requiere un token Bearer válido.' });

  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'noir-api', audience: 'noir-web',
    });
    const id = Number(claims.sub);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid subject');
    req.user = { id };
    return next();
  } catch {
    return res.status(401).json({ error: 'El token no es válido o ha expirado.' });
  }
}
