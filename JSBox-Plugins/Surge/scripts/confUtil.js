const CONF = 'Surge/Surge.conf';
const HOST = 'Surge/Host.conf';

function parseConf() {
    let groups = [];

    if ($drive.exists(CONF)) {
        const CONFIG = $drive.read(CONF).string;
        let rows = /(?:\[Proxy Group\])([^[]*)/.exec(CONFIG)[1].trim().split('\n');
        rows.forEach(i => {
            /([^=]*)=(.*)/.exec(i);
            let groupName = RegExp.$1.trim();
            let groupConfs = RegExp.$2.trim().split(',');
            let groupType = groupConfs.shift();
            let proxies = [];
            switch (groupType) {
                case 'select':
                    groupConfs.forEach(j => proxies.push({ proxyName: j.trim() }));
                    break;
                case 'ssid':
                    groupConfs.forEach(j => proxies.push({ proxyName: j.trim().replace(/(\s*=\s*)/, ': ') }));
                    break;
                case 'url-test':
                    groupConfs.forEach(j => /=/.test(j) || proxies.push({ proxyName: j.trim() }));
                    break;
                default:
                    break;
            }
            groups.push({ groupName: groupName, groupType: groupType, proxies: proxies });
        });
    }

    return groups;
}

function storeConf(conf) {
    /(.*)\/(.*)$/.exec(CONF);

    if (!$drive.exists(RegExp.$1)) {
        $drive.mkdir(RegExp.$1);
    }

    $drive.write({
        data: $data({ string: conf }),
        path: CONF
    });
}

function parseHost() {
    let host = {};

    if ($drive.exists(HOST)) {
        host = JSON.parse($drive.read(HOST).string);
    }

    return host;
}

function storeHost(host) {
    /(.*)\/(.*)$/.exec(HOST);

    if (!$drive.exists(RegExp.$1)) {
        $drive.mkdir(RegExp.$1);
    }

    $drive.write({
        data: $data({ string: host }),
        path: HOST
    });
}

module.exports = {
    parseConf: parseConf,
    storeConf: storeConf,
    parseHost: parseHost,
    storeHost: storeHost
}