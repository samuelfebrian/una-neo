import Footer from 'app/components/nav/footer'
import StepBackFlow from 'app/customization/courses/apps/step-back-flow';

// Route back to the lesson that opened the UNA create pages
// (Add Step → publish → back to the lesson); everything else is the core footer.
export default function (props) {
    return <><StepBackFlow /><Footer {...props}/></>;
}
