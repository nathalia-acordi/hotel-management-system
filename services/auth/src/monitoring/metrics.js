import { Counter, Histogram, Gauge, register } from "prom-client";

const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total de requisições HTTP",
  labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duração das requisições HTTP",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 1, 2, 5],
});

const httpErrors = new Gauge({
  name: "http_errors_total",
  help: "Número de erros HTTP",
  labelNames: ["route"],
});

export function attachMetrics(app) {
  app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path || req.path || req.originalUrl || "unknown";
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status: res.statusCode,
      });
      end({ method: req.method, route, status: res.statusCode });
      if (res.statusCode >= 500) httpErrors.inc({ route });
    });
    next();
  });

  app.get("/metrics", async (req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  });
}

export default { attachMetrics };
