import { useLanguage } from '../context/LanguageContext';
import SwapFeature from '../Body';

function Trading() {
    const { t } = useLanguage();

    return (
        <div style={{ marginTop: '20px' }}>
            <SwapFeature />
        </div>
    );
}

export default Trading;