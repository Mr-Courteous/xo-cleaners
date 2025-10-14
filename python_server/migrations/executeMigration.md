docker cp .\python_server\migrations\update_ticket.sql xocleaners-db-1:/tmp/update_ticket.sql

docker-compose exec -it db psql -U postgres -d cleanpress -c "\i /tmp/update_ticket.sql"

docker cp .\python_server\migrations\add_paid_amount.sql xocleaners-db-1:/tmp/add_paid_amount.sql

docker-compose exec -it db psql -U postgres -d cleanpress -c "\i /tmp/add_paid_amount.sql"
