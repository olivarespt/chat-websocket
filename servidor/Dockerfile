# Para hosts que ejecutan contenedores (Render, Railway, Fly.io, etc.)
FROM denoland/deno:2.5.6
WORKDIR /app
COPY main.ts .
RUN deno cache main.ts
EXPOSE 8000
# El host define PORT; main.ts lo lee. Mantén UNA sola instancia.
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
