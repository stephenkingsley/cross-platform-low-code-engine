import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, FormControl, Heading, Note, Paragraph, TextInput } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback, useEffect, useState } from 'react';

export interface AppInstallationParameters {
    /** Content type whose Entry Editor this app takes over (default `lcePage`). */
    contentTypeId?: string;
}

const DEFAULT_CT = 'lcePage';

const ConfigScreen = () => {
    const [parameters, setParameters] = useState<AppInstallationParameters>({ contentTypeId: DEFAULT_CT });
    const sdk = useSDK<ConfigAppSDK>();

    const onConfigure = useCallback(async () => {
        const contentTypeId = (parameters.contentTypeId || DEFAULT_CT).trim();
        const currentState = await sdk.app.getCurrentState();
        return {
            parameters: { contentTypeId },
            // Assign THIS app as the entry editor for `contentTypeId` on install — so opening
            // an `lcePage` entry shows the visual builder instead of the default form.
            targetState: {
                EditorInterface: {
                    ...(currentState?.EditorInterface ?? {}),
                    [contentTypeId]: { editor: true },
                },
            },
        };
    }, [parameters, sdk]);

    useEffect(() => {
        sdk.app.onConfigure(() => onConfigure());
    }, [sdk, onConfigure]);

    useEffect(() => {
        (async () => {
            const current = (await sdk.app.getParameters()) as AppInstallationParameters | null;
            if (current?.contentTypeId) setParameters(current);
            sdk.app.setReady();
        })();
    }, [sdk]);

    return (
        <Flex flexDirection="column" className={css({ margin: '80px auto', maxWidth: 720 })}>
            <Form>
                <Heading>DragonPass Page Builder</Heading>
                <Paragraph>
                    安装后,本 App 会作为下面这个内容类型的 <b>Entry editor</b>:运营在该类型的条目里用可视化
                    搭建器配置页面,结果存进它的 <code>document</code> 字段。线上按 <code>slug</code>/id 取{' '}
                    <code>document</code> 交给运行时渲染。
                </Paragraph>
                <FormControl>
                    <FormControl.Label>内容类型 ID</FormControl.Label>
                    <TextInput
                        value={parameters.contentTypeId ?? ''}
                        placeholder={DEFAULT_CT}
                        onChange={(e) => setParameters({ contentTypeId: e.target.value })}
                    />
                    <FormControl.HelpText>
                        默认 <code>{DEFAULT_CT}</code>。请先用 <code>npm run setup:model</code> 创建该类型(含{' '}
                        <code>document</code> Object 字段)。
                    </FormControl.HelpText>
                </FormControl>
                <Note variant="neutral">
                    该类型需要一个 id 为 <code>document</code> 的 JSON(Object)字段来存页面文档。
                </Note>
            </Form>
        </Flex>
    );
};

export default ConfigScreen;
