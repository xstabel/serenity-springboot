#!/bin/bash

keystore=/etc/pki/java/cacerts

echo "Importing trusted CA certificates"
for certfile in `ls *.pem *.cert *.cer 2>/dev/null`
do
   keytool -import -noprompt -alias $certfile -keystore $keystore -storepass changeit -file $certfile
done
