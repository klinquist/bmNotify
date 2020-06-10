const MINIMUM_REQUIRED_TRANSMIT_TIME_SECONDS = 2;
const TALK_GROUPS_TO_MONITOR = [3100];
const ONLY_NOTIFY_IF_NO_TRANSMISSIONS_FOR_SECONDS = 0;  // 0 = don't use this feature
const IRC_CHANNEL = '#MyIRCChannel';
const IRC_SERVER = 'irc.blahblah.com';
const BOT_NICK = 'MYCALLSIGN-BOTNAME';

//Do not display messages older than CACHE_SECONDS ago and do not display messages with a duplicate SessionID within CACHE_SECONDS. The default value is typically fine here.
const CACHE_SECONDS = 60;
const io = require('socket.io-client');
const moment = require('moment');
const NodeCache = require('node-cache');
const sessionIdCache = new NodeCache({ stdTTL: CACHE_SECONDS });
const lastHeardCache = new NodeCache();

const BM_DEFAULT_URL = 'https://api.brandmeister.network';

const BM_DEFAULT_OPTS = {
    path: '/lh',
    reconnection: true
};

const socket = io(BM_DEFAULT_URL, BM_DEFAULT_OPTS);

socket.open();

socket.on('connect', () => {
    console.log('Connected to BM API');
});


const irc = require('irc');
const client = new irc.Client(IRC_SERVER, BOT_NICK, {
    channels: [IRC_CHANNEL],
});


socket.on('mqtt', (msg) => {
    const lhMsg = JSON.parse(msg.payload);
    if (TALK_GROUPS_TO_MONITOR.indexOf(lhMsg.DestinationID) > -1 && lhMsg.Event == 'Session-Stop' && (lhMsg.Stop - lhMsg.Start) >= MINIMUM_REQUIRED_TRANSMIT_TIME_SECONDS && !sessionIdCache.get(lhMsg.SessionID)) {
        sessionIdCache.set(lhMsg.SessionID, true);
        if ((Math.round(new Date().getTime() / 1000) - lhMsg.Stop) <= CACHE_SECONDS) {
            const lastHeard = lastHeardCache.get(lhMsg.DestinationID);
            lastHeardCache.set(lhMsg.DestinationID, new Date().getTime());
            if (!ONLY_NOTIFY_IF_NO_TRANSMISSIONS_FOR_SECONDS || (ONLY_NOTIFY_IF_NO_TRANSMISSIONS_FOR_SECONDS && (!lastHeard || new Date().getTime() - lastHeard > ONLY_NOTIFY_IF_NO_TRANSMISSIONS_FOR_SECONDS * 1000))) {
                let talkerAlias = (lhMsg.TalkerAlias) ? `(${lhMsg.TalkerAlias})` : '';
                talkerAlias = talkerAlias.replace(lhMsg.SourceCall, '').trim();
                const duration = moment.duration(0 - (new Date().getTime() - lastHeard)).humanize();
                const msg = `Talkgroup ${lhMsg.DestinationID} - Transmission from ${lhMsg.SourceCall} ${talkerAlias} lasted ${lhMsg.Stop - lhMsg.Start} seconds. The previous transmission was ${duration} ago.`;
                console.log(msg);
                client.say(IRC_CHANNEL, msg);
            } else {
                console.log('Not notifying, last activity was too soon.');
            }
        }
    }
});





