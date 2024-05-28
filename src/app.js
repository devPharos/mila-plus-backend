import express from 'express';
import cors from 'cors';
import Youch from 'youch';
// import 'express-async-errors';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();

    this.middlewares();
    this.routes();
    this.exceptionHandler();
  }

  middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(
      cors({
        origin: ['http://localhost:3000', 'https://milaplus.netlify.app'],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true, // This option is important for handling cookies and authentication headers
      })
    );
  }

  routes() {
    this.server.use(routes);
  }

  exceptionHandler() {
    this.server.use(async (err, req, res, next) => {
      const errors = await new Youch(err, req).toJSON();

      return res.status(500).json(errors);
    });
  }
}

export default new App().server;
