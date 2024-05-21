import * as Yup from 'yup';

export default async (req, res, next) => {
  try {
    const schema = Yup.object().shape({
      filial_id: Yup.number().positive().integer().required(),
      user_id: Yup.number().positive().integer().required(),
    });

    await schema.validate(req.body, { abortEarly: false });

    return next();
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Dados incorretos! ', messages: err.inner });
  }
};