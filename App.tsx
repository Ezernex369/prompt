import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppMode, GuidedFormState, AdvancedFormState, Message, TranslateFormState, SunoFormState } from './types';
import * as geminiService from './services/geminiService';
import ModeSwitcher from './components/ModeSwitcher';
import GuidedModeForm from './components/GuidedModeForm';
import AdvancedModeForm, { AdvancedFormRef } from './components/AdvancedModeForm';
import ResultDisplay from './components/ResultDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox';
import { LogoIcon } from './components/icons';
import TranslateModeForm from './components/TranslateModeForm';
import SunoModeForm from './components/SunoModeForm';

const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('advanced');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    const [currentInputs, setCurrentInputs] = useState<TranslateFormState | GuidedFormState | AdvancedFormState | SunoFormState | null>(null);
    const [currentReferenceImage, setCurrentReferenceImage] = useState<string | undefined>(undefined);
    const [sceneCount, setSceneCount] = useState<number>(1);
    const advancedFormRef = useRef<AdvancedFormRef>(null);

    const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
    const [generatedWidescreenImage, setGeneratedWidescreenImage] = useState<string | null>(null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const displayMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
    };

    const handleGenerate = useCallback(async (inputs: TranslateFormState | GuidedFormState | AdvancedFormState | SunoFormState, referenceImageBase64?: string, promotionalImageBase64?: string) => {
        setIsLoading(true);
        setError(null);
        setResult('');
        setCurrentInputs(inputs);
        setCurrentReferenceImage(referenceImageBase64);
        setSceneCount(1);
        setGeneratedWidescreenImage(null);
        setIsGeneratingImage(false);

        try {
            let generatedPrompt: string;
            switch (mode) {
                case 'translate':
                    generatedPrompt = await geminiService.translatePrompt(inputs as TranslateFormState);
                    break;
                case 'guided':
                    generatedPrompt = await geminiService.generateGuidedPrompt(inputs as GuidedFormState);
                    break;
                case 'suno':
                     generatedPrompt = await geminiService.generateSunoPrompt(inputs as SunoFormState);
                     break;
                case 'advanced':
                default:
                    generatedPrompt = await geminiService.generateAdvancedPrompt(inputs as AdvancedFormState, referenceImageBase64, promotionalImageBase64);
                    break;
            }
            setResult(generatedPrompt);

            if (mode === 'advanced' && referenceImageBase64) {
                setIsGeneratingImage(true);
                geminiService.createWidescreenImageFromReference(referenceImageBase64)
                    .then(newImageBase64 => {
                        setGeneratedWidescreenImage(newImageBase64);
                    })
                    .catch(e => {
                        console.error("Error generating widescreen image:", e);
                        displayMessage('AI ไม่สามารถสร้างภาพ 16:9 ได้', 'error');
                    })
                    .finally(() => {
                        setIsGeneratingImage(false);
                    });
            }

        } catch (e) {
            console.error(e);
            setError('เกิดข้อผิดพลาดในการสร้าง Prompt กรุณาตรวจสอบ API key และลองอีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    }, [mode]);
    
    const handleEnchant = useCallback(async () => {
        if (!result) return;
        setIsLoading(true);
        setError(null);
        try {
            let enchantedResult: string;
            if (mode === 'suno') {
                enchantedResult = await geminiService.enchantSunoPrompt(result);
            } else {
                enchantedResult = await geminiService.enchantPrompt(result);
            }
            setResult(enchantedResult);
        } catch (e) {
            console.error(e);
            setError('เกิดข้อผิดพลาดในการร่ายมนตร์ให้ Prompt');
        } finally {
            setIsLoading(false);
        }
    }, [result, mode]);

    const handleVariations = useCallback(async () => {
        if (!currentInputs) {
            setError("ไม่มีข้อมูลสำหรับสร้าง Variations");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedWidescreenImage(null);
        try {
            if (mode === 'suno') {
                displayMessage('ไม่สามารถสร้าง Variations ในโหมด Suno ได้', 'error');
                return;
            }
            const variations = await geminiService.generateVariations(currentInputs, currentReferenceImage, mode);
            setResult(variations);
            setSceneCount(1);
        } catch (e) {
            console.error(e);
            setError('เกิดข้อผิดพลาดในการสร้าง Variations');
        } finally {
            setIsLoading(false);
        }
    }, [currentInputs, currentReferenceImage, mode]);
    
    const handleContinueScene = useCallback(async () => {
        const formState = advancedFormRef.current?.getFormState();
        if (!result || !formState || mode !== 'advanced') {
            displayMessage('สามารถสร้างฉากต่อได้ในโหมดขั้นสูงและต้องมี Prompt เริ่มต้นก่อน', 'error');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedWidescreenImage(null);
        try {
            const nextSceneCount = sceneCount + 1;
            const { inputs, referenceImageBase64, promotionalImageBase64 } = formState;
            const nextScenePrompt = await geminiService.continueScenePrompt(result, inputs, referenceImageBase64, promotionalImageBase64);
            
            setResult(prev => `${prev}\n\n---\n\n**SCENE ${nextSceneCount}**\n${nextScenePrompt}`);
            setSceneCount(nextSceneCount);
            setCurrentInputs(inputs); 
            setCurrentReferenceImage(referenceImageBase64);

        } catch (e) {
            console.error(e);
            setError('เกิดข้อผิดพลาดในการสร้างฉากต่อ');
        } finally {
            setIsLoading(false);
        }
    }, [result, mode, sceneCount]);


    const renderForm = () => {
        switch (mode) {
            case 'translate':
                return <TranslateModeForm onGenerate={handleGenerate} isLoading={isLoading} />;
            case 'guided':
                return <GuidedModeForm onGenerate={handleGenerate} isLoading={isLoading} />;
            case 'suno':
                return <SunoModeForm onGenerate={handleGenerate} isLoading={isLoading} />;
            case 'advanced':
                return <AdvancedModeForm ref={advancedFormRef} onGenerate={handleGenerate} isLoading={isLoading} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen text-white font-sans bg-dark-primary">
            {isLoading && <LoadingSpinner />}
            {message && <MessageBox message={message.text} type={message.type} />}
            
            <header className="sticky top-0 z-30 flex items-center gap-3 p-4 border-b border-dark-tertiary/50 bg-dark-primary/80 backdrop-blur-md">
                 <div className="max-w-screen-2xl mx-auto flex items-center gap-3 w-full">
                    <LogoIcon className="w-8 h-8 text-accent-cyan" />
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-accent-magenta">
                        Director's AI
                    </h1>
                </div>
            </header>

            <div className="max-w-screen-2xl mx-auto">
                <main className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col gap-6">
                        <ModeSwitcher mode={mode} setMode={setMode} />
                        <div className="animate-fade-in">
                          {renderForm()}
                        </div>
                    </div>
                    <div className="lg:sticky lg:top-24 self-start">
                         <ResultDisplay 
                            result={result}
                            error={error}
                            isLoading={isLoading}
                            onEnchant={handleEnchant}
                            onVariations={handleVariations}
                            onContinueScene={handleContinueScene}
                            onShowMessage={displayMessage}
                            currentMode={mode}
                            isGeneratingImage={isGeneratingImage}
                            generatedWidescreenImage={generatedWidescreenImage}
                         />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;