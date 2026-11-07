import { View } from 'app/design/view';
import { Text } from 'app/design/typography';

import type { ModuleAppProps } from './module-app.types';

/** Native fallback: plain lesson list from the L2 payload. */
export default function ModuleApp(props: ModuleAppProps) {
    const items = (props.data?.items ?? []) as Record<string, unknown>[];
    return (
        <View className="p-4">
            {items.map((item, index) => (
                <Text key={(item.id as number) ?? index} className="text-secondary-foreground">
                    {String(item.title ?? '')}
                </Text>
            ))}
        </View>
    );
}
