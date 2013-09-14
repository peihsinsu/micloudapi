cd /root/
/opt/local/bin/git clone https://github.com/arecord/opennodes.arecord.us.git
cd opennodes.arecord.us 
/opt/local/bin/npm install
nohup /opt/local/bin/node server.js &
