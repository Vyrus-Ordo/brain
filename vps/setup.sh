#!/bin/bash
# Executar na raiz do repositório brain no VPS
# chmod +x vps/setup.sh && ./vps/setup.sh

set -e

echo "=== Brain App — Setup VPS ==="

# 1. Descobrir rede do postgres
echo ""
echo ">>> Descobrindo rede do container postgres..."
POSTGRES_NETWORK=$(docker inspect postgres \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' \
  | awk '{print $1}')
echo "    Rede encontrada: $POSTGRES_NETWORK"

# 2. Criar banco brain no postgres existente
echo ""
echo ">>> Criando banco de dados 'brain'..."
docker exec -i postgres psql -U postgres \
  -c "CREATE DATABASE brain;" 2>/dev/null \
  && echo "    Banco criado." \
  || echo "    Banco já existe, pulando."

# 3. Aplicar schema + seed
echo ""
echo ">>> Aplicando schema e seed..."
docker exec -i postgres psql -U postgres -d brain < vps/init-db.sql
echo "    Schema aplicado."

# 4. Garantir que a rede 'web' existe (compartilhada com infra-nginx)
echo ""
echo ">>> Garantindo que a rede 'web' existe..."
docker network create web 2>/dev/null || echo "    Rede 'web' já existe."

# 5. Criar .env se não existir
if [ ! -f .env ]; then
  echo ""
  echo ">>> Criando .env a partir do .env.example..."
  cp .env.example .env
  echo "    ATENÇÃO: edite .env e defina DATABASE_URL com a senha correta!"
  echo "    Pressione Enter após editar..."
  read -r
fi

# 6. Build e start
echo ""
echo ">>> Subindo containers brain..."
DATA_NETWORK="$POSTGRES_NETWORK" docker compose up -d --build
echo "    Containers iniciados."

# 7. Conectar brain-frontend à rede web (para o infra-nginx acessar)
echo ""
echo ">>> Conectando brain-frontend à rede 'web'..."
docker network connect web brain-frontend 2>/dev/null \
  || echo "    Já conectado."

echo ""
echo "=== Próximos passos ==="
echo ""
echo "1. Adicione o SSL para brain.privo.app.br no VPS:"
echo "   certbot certonly --webroot -w /var/www/html -d brain.privo.app.br"
echo ""
echo "2. Adicione o nginx config ao infra-nginx:"
echo "   docker cp vps/nginx-brain.conf infra-nginx:/etc/nginx/conf.d/brain.conf"
echo "   docker exec infra-nginx nginx -s reload"
echo ""
echo "3. Verifique os logs:"
echo "   docker compose logs -f"
