# Dockerfile

FROM nginx:alpine

# Kopiere die statischen Dateien in das Standard-Webverzeichnis von Nginx

COPY public/ /usr/share/nginx/html

# Exponiere den Standard-HTTP-Port
EXPOSE 80

# Kommentar: Nginx startet automatisch und serviert die Dateien
CMD ["nginx", "-g", "daemon off;"]
