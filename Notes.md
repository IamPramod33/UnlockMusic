Commands to kill the server:
lsof -nP -iTCP:4000 -sTCP:LISTEN | cat 
kill -9 $(lsof -t -iTCP:4000 -sTCP:LISTEN) || true