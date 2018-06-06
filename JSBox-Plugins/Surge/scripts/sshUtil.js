const confUtil = require('scripts/confUtil');

async function selectProxy(groupName, proxyName) {
    const JXA = `let menu = Application('System Events').processes.Surge.menuBars[1].menuBarItems[0];
        menu.actions.AXShowMenu.perform();
        menu.menus[0].menuItems['${groupName}'].click().menus[0].menuItems['${proxyName}'].click();`;

    let result = await exec('osascript -l JavaScript <<EOF\n' + JXA + '\nEOF');

    if (!result.connectFailed && result.error) {
        await hideMenu();
    }

    return result;
}

async function syncStatus(count) {
    const SCPT = `tell application "System Events"
        tell process "Surge"
            tell menu bar item 1 of menu bar 2
                perform action "AXShowMenu"
                set status to {}
                repeat with i from 3 to ${count + 2}
                    tell menu item i of menu 1
                        set target to (a reference to (menu item 1 of menu 1 whose value of attribute "AXMenuItemMarkChar" is "✓"))
                        if target exists then
                            set end of status to name of target
                        else
                            set end of status to ""
                        end if
                    end tell
                end repeat
                perform action "AXCancel" of menu 1
                status
            end tell
        end tell
    end tell`;

    let result = await exec('osascript <<EOF\n' + SCPT + '\nEOF');

    if (!result.error) {
        result.response = result.response.split(',').map(i => i.trim());
    }

    return result;
}

async function hideMenu() {
    const JXA = `let menu = Application('System Events').processes.Surge.menuBars[1].menuBarItems[0];
        menu.actions.AXShowMenu.perform();
        menu.menus[0].actions.AXCancel.perform();`;

    return await exec('osascript -l JavaScript <<EOF\n' + JXA + '\nEOF');
}

async function exec(script) {
    const HOST = confUtil.parseHost();

    let { session: session, response: response } = await $ssh.connect({
        host: HOST.host,
        port: HOST.port || 22,
        username: HOST.username,
        password: HOST.password,
        public_key: HOST.publicKey,
        private_key: HOST.privateKey
        // script: script
    });

    // console.log(session.lastError);
    // console.log(response);
    if (!session.authorized) {
        return { error: session.lastError, connectFailed: true }
    } else {
        // return { response: response }
        return await session.channel.execute({ script: script });
    }
}

module.exports = {
    selectProxy: selectProxy,
    syncStatus: syncStatus
}