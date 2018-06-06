const confUtil = require('scripts/confUtil');
const sshUtil = require('scripts/sshUtil');

function renderUI() {
    $ui.render({
        props: {
            title: 'Surge Gateway Control',
            navBarHidden: $app.env === $env.today,
            bgcolor: $color('clear')
        },
        views: [{
            type: 'blur',
            props: {
                id: 'mainView',
                style: 1,
            },
            layout: $layout.fill,
            views: [{
                type: 'list',
                props: {
                    id: 'policyGroupList',
                    bgcolor: $color('clear'),
                    template: {
                        views: [{
                            type: 'label',
                            props: {
                                id: 'groupName',
                                align: $align.center
                            },
                            layout: function (make) {
                                make.left.right.equalTo(0);
                                make.top.inset(5);
                            }
                        }, {
                            type: 'label',
                            props: {
                                id: 'currentProxy',
                                align: $align.center,
                                font: $font(10)
                            },
                            layout: function (make) {
                                make.left.right.equalTo(0);
                                make.bottom.inset(5);
                            }
                        }]
                    },
                    data: [],
                },
                layout: (make, view) => {
                    make.width.equalTo(view.super);
                    if ($app.env !== $env.today) {
                        make.height.equalTo(view.super).offset(-60);
                    } else {
                        make.height.equalTo(view.super);
                    }
                    make.centerX.equalTo(view.super);
                },
                events: {
                    didSelect: function (groupSender, groupIndex, groupData) {
                        $ui.push({
                            props: {
                                navBarHidden: $app.env === $env.today,
                                bgcolor: $color('clear')
                            },
                            views: [{
                                type: 'list',
                                props: {
                                    id: 'proxyList',
                                    bgcolor: $color('clear'),
                                    template: {
                                        views: [{
                                            type: 'label',
                                            props: {
                                                id: 'proxyName',
                                                align: $align.center
                                            },
                                            layout: $layout.fill
                                        }]
                                    },
                                    data: [],
                                },
                                layout: $layout.fill,
                                events: {
                                    didSelect: async function (sender, indexPath, proxyData) {
                                        if (groupData.groupType === 'select') {
                                            $ui.pop();

                                            let result = await sshUtil.selectProxy(groupData.groupName.text, proxyData.proxyName.text)
                                            if (result.error) {
                                                $ui.alert({
                                                    title: 'Failed',
                                                    message: result.error.localizedDescription,
                                                });
                                            } else {
                                                // groupSender.cell(groupIndex).views[0].views[0]
                                                // groupSender.views[5].views[0].views[1].text = proxyData.proxyName.text;
                                                $ui.toast(proxyData.proxyName.text);
                                                let uiData = groupSender.data;
                                                uiData[groupIndex.row].currentProxy = { text: proxyData.proxyName.text };
                                                groupSender.data = uiData;
                                            }
                                        } else {
                                            $ui.pop();
                                        }
                                    }
                                }
                            }]
                        });
                        $('proxyList').data = groupData.proxies.map(i => ({ proxyName: { text: i.proxyName } }));
                    }
                }
            }]
        }]
    });

    loadSurgeConf();

    if ($app.env !== $env.today) {
        renderConfigUI();
    }
}

function renderConfigUI() {
    $('mainView').add({
        type: 'button',
        props: {
            title: 'Surge 配置'
        },
        layout: function (make, view) {
            make.width.equalTo(view.super.width).dividedBy(2).offset(-15);
            make.height.equalTo(40);
            make.top.equalTo($('policyGroupList').bottom).offset(10);
            make.left.offset(10);

        },
        events: {
            tapped: async sender => {
                let conf = await $drive.open();
                if (conf) {
                    confUtil.storeConf(conf.string);
                    await loadSurgeConf();
                }
            }
        }
    });

    $('mainView').add({
        type: 'button',
        props: {
            title: 'Host 配置'
        },
        layout: function (make, view) {
            make.width.equalTo(view.super.width).dividedBy(2).offset(-15);
            make.height.equalTo(40);
            make.top.equalTo($('policyGroupList').bottom).offset(10);
            make.right.offset(-10);
        },
        events: {
            tapped: sender => {
                $ui.push({
                    props: {
                        title: 'Host 配置'
                    },
                    views: [{
                        type: 'label',
                        props: {
                            id: 'basicLabel',
                            align: $align.center,
                            text: '常规设置'
                        },
                        layout: function (make, view) {
                            make.width.equalTo(view.super);
                            make.height.equalTo(50);
                            make.centerX.equalTo(view.super);
                        }
                    }, {
                        type: 'matrix',
                        props: {
                            id: 'basicMatrix',
                            scrollEnabled: false,
                            columns: 2,
                            itemHeight: 40,
                            spacing: 5,
                            template: [{
                                type: 'input',
                                props: {
                                    id: 'basicInput',
                                    align: $align.center
                                },
                                layout: $layout.fill,
                                events: {
                                    didEndEditing: genHostConf
                                }
                            }],
                            data: [{
                                basicInput: {
                                    placeholder: 'Host',
                                }
                            },
                            {
                                basicInput: {
                                    placeholder: 'Port: 22',
                                    type: $kbType.number
                                }
                            },
                            {
                                basicInput: {
                                    placeholder: 'Username'
                                }
                            },
                            {
                                basicInput: {
                                    placeholder: 'Password',
                                }
                            }]
                        },
                        layout: (make, view) => {
                            make.left.right.inset(5)
                            make.height.equalTo(90);
                            make.centerX.equalTo(view.super);
                            make.top.equalTo($('basicLabel').bottom)
                        }
                    }, {
                        type: 'label',
                        props: {
                            id: 'advancedLabel',
                            align: $align.center,
                            text: '密钥设置'
                        },
                        layout: function (make, view) {
                            make.width.equalTo(view.super);
                            make.height.equalTo(50);
                            make.centerX.equalTo(view.super);
                            make.top.equalTo($('basicMatrix').bottom);
                        }
                    }, {
                        type: 'list',
                        props: {
                            id: 'advancedList',
                            scrollEnabled: false,
                            rowHeight: 150,
                            template: {
                                views: [{
                                    type: 'text',
                                    props: {
                                        id: 'advancedText'
                                    },
                                    layout: function (make, view) {
                                        make.height.equalTo(150);
                                        make.left.right.inset(10);
                                    },
                                    events: {
                                        didEndEditing: genHostConf
                                    }
                                }]
                            },
                            data: [{
                                title: 'Public Key',
                                rows: [{}]
                            }, {
                                title: 'Private Key',
                                rows: [{}]
                            }]
                        },
                        layout: function (make, view) {
                            make.width.equalTo(view.super);
                            make.height.equalTo(600);
                            make.top.equalTo($('advancedLabel').bottom);
                        }
                    }]
                });

                loadHostConf();
            }
        }
    });
}

function genHostConf() {
    let host = {
        host: $('basicMatrix').cell($indexPath(0, 0)).views[0].views[0].text,
        port: $('basicMatrix').cell($indexPath(0, 1)).views[0].views[0].text,
        username: $('basicMatrix').cell($indexPath(0, 2)).views[0].views[0].text,
        password: $('basicMatrix').cell($indexPath(0, 3)).views[0].views[0].text,
        publicKey: $('advancedList').cell($indexPath(0, 0)).views[0].views[0].text,
        privateKey: $('advancedList').cell($indexPath(1, 0)).views[0].views[0].text
    }

    confUtil.storeHost(JSON.stringify(host));
}

function loadHostConf() {
    const HOST = confUtil.parseHost();

    let basicData = $('basicMatrix').data;
    let advancedData = $('advancedList').data;

    basicData[0].basicInput.text = HOST.host;
    basicData[1].basicInput.text = HOST.port;
    basicData[2].basicInput.text = HOST.username;
    basicData[3].basicInput.text = HOST.password;
    advancedData[0].rows[0].advancedText = { text: HOST.publicKey };
    advancedData[1].rows[0].advancedText = { text: HOST.privateKey };

    $('basicMatrix').data = basicData;
    $('advancedList').data = advancedData;
}

async function loadSurgeConf() {
    const GROUPS = confUtil.parseConf();
    GROUPS.forEach(i => i.groupName = { text: i.groupName });
    $("policyGroupList").data = GROUPS;
    const { response: status, error: error } = await sshUtil.syncStatus(GROUPS.length);
    if (!error) {
        GROUPS.forEach((i, n) => i.currentProxy = { text: status[n] });
        $("policyGroupList").data = GROUPS;
    }
}

module.exports = {
    renderUI: renderUI
}