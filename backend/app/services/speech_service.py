from ai_models.telugu_speech_handler import TeluguSpeechProcessor

speech_processor = TeluguSpeechProcessor()

def process_telugu_voice_input(audio_file_path: str = None, text_input: str = None) -> dict:
    """
    Processes Telugu Voice Recording or Text Input and returns structured complaint attributes.
    """
    return speech_processor.process_speech_file(audio_file_path, sample_telugu_text=text_input)
