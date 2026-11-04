const positiveId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

function validate(fields, body, partial = false) {
  const errors = [];
  for (const field of fields) {
    if (partial && body[field.name] === undefined) continue;
    const value = body[field.name];
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
      errors.push(`${field.name} es obligatorio.`);
      continue;
    }
    if (value === undefined || value === null || value === '') continue;
    if (field.type === 'text' && typeof value !== 'string') errors.push(`${field.name} debe ser texto.`);
    if (field.type === 'url' && (typeof value !== 'string' || !isHttpsUrl(value))) errors.push(`${field.name} debe ser una URL HTTPS válida.`);
    if (field.type === 'number' && (!Number.isFinite(Number(value)) || Number(value) < 0)) errors.push(`${field.name} debe ser un número mayor o igual a cero.`);
    if (field.type === 'integer' && (!Number.isInteger(Number(value)) || Number(value) < 0)) errors.push(`${field.name} debe ser un entero mayor o igual a cero.`);
    if (field.type === 'id' && (!Number.isInteger(Number(value)) || Number(value) <= 0)) errors.push(`${field.name} debe ser un identificador válido.`);
  }
  return errors;
}

function isHttpsUrl(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function entityController({ model, fields, label }) {
  const allowed = new Set(fields.map((field) => field.name));
  const pick = (body) => Object.fromEntries(Object.entries(body).filter(([key]) => allowed.has(key)));

  return {
    async list(req, res, next) {
      try { res.json({ data: await model.findAll(req.query.search) }); } catch (error) { next(error); }
    },
    async get(req, res, next) {
      if (!positiveId(req.params.id)) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
      try {
        const row = await model.findById(Number(req.params.id));
        return row ? res.json({ data: row }) : res.status(404).json({ error: `${label} no encontrado.` });
      } catch (error) { return next(error); }
    },
    async create(req, res, next) {
      const errors = validate(fields, req.body || {});
      if (errors.length) return res.status(400).json({ error: 'Datos inválidos.', details: errors });
      try { return res.status(201).json({ data: await model.create(pick(req.body)) }); } catch (error) { return next(error); }
    },
    async update(req, res, next) {
      if (!positiveId(req.params.id)) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
      const data = pick(req.body || {});
      const errors = validate(fields, data, true);
      if (!Object.keys(data).length) errors.push('Debe enviar al menos un campo válido.');
      if (errors.length) return res.status(400).json({ error: 'Datos inválidos.', details: errors });
      try {
        const row = await model.update(Number(req.params.id), data);
        return row ? res.json({ data: row }) : res.status(404).json({ error: `${label} no encontrado.` });
      } catch (error) { return next(error); }
    },
    async remove(req, res, next) {
      if (!positiveId(req.params.id)) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
      try {
        const removed = await model.remove(Number(req.params.id));
        return removed ? res.status(204).end() : res.status(404).json({ error: `${label} no encontrado.` });
      } catch (error) { return next(error); }
    },
  };
}
