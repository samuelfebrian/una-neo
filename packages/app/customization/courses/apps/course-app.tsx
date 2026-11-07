import { View } from 'app/design/view';
import { Text } from 'app/design/typography';

import type { CourseAppProps } from './course-app.types';

/**
 * Native fallback: the full curriculum experience is web-only for now; native
 * renders the module list without the designed layout until the screens are
 * ported to NEO design tokens for native.
 */
export default function CourseApp(_props: CourseAppProps) {
    return (
        <View className="p-4">
            <Text className="text-secondary-foreground">
                Open the web app for the full course experience.
            </Text>
        </View>
    );
}
