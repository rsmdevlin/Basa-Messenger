#!/bin/bash
# Check what tables exist in MySQL
mysql -h 80.242.59.112 -u gs348298 -peKDxA99Mc2sf gs348298 <<EOF
SHOW TABLES;
EOF
