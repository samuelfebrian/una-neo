import { View } from 'app/design/view';
import { Text } from 'app/design/typography';

import type { LessonAppProps } from './lesson-app.types';

/**
 * Native fallback: the designed lesson player is web-only for now.
 */
export default function LessonApp(props: LessonAppProps) {
    const steps = props.data?.steps ?? [];
    return (
        <View className="p-4">
            <Text className="text-lg font-bold text-secondary-foreground">{props.data?.title}</Text>
            {steps.map((step, index) => (
                <Text key={(step as any)?.id ?? index} className="text-secondary-foreground">
                    {String((step as any)?.title ?? '')}
                </Text>
            ))}
        </View>
    );
}
