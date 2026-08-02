import { useState, type ChangeEvent, type DragEvent } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { DetectedSong, Song } from '../../types/song';
import { MOCK_DETECTED_SONGS } from './mockData'; // MOCK — quitar
import styles from './Landing.module.css';

interface UploadPanelProps {
  onValidateWithAI?: (image: File | string) => void;
  onAddSong?: (song: Song) => void;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'var(--color-spotify)';
  if (confidence >= 75) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function UploadPanel({ onValidateWithAI, onAddSong }: UploadPanelProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [detectedSongs, setDetectedSongs] = useState<DetectedSong[] | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const setImageFromFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageFromFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setImageFromFile(e.dataTransfer.files?.[0]);
  };

  const handleClear = () => {
    setImage(null);
    setDetectedSongs(null);
  };

  const handleValidate = () => {
    if (!image) return;
    if (onValidateWithAI) {
      onValidateWithAI(image);
    } else {
      console.log('onValidateWithAI not implemented', image);
    }
    // MOCK — quitar: simula 1.2s de carga y devuelve canciones de ejemplo.
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setDetectedSongs(MOCK_DETECTED_SONGS);
    }, 1200);
  };

  const handleAdd = (song: Song) => {
    setAddedIds((prev) => new Set(prev).add(song.id));
    if (onAddSong) {
      onAddSong(song);
    } else {
      console.log('onAddSong not implemented', song);
    }
  };

  return (
    <div className={styles.tabContent}>
      {!image && (
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept="image/*" data-testid="upload-input" onChange={handleFileChange} className={styles.dropZoneInput} />
          <p className={styles.emptyTitle}>Drop your Apple Music screenshot</p>
          <p className={styles.emptyHint}>or click to browse — PNG, JPG supported</p>
        </div>
      )}

      {image && (
        <div className={styles.uploadedWrap}>
          <div className={styles.preview} style={{ backgroundImage: `url(${image})` }}>
            <IconButton
              className={styles.clearBtn}
              data-testid="clear-image"
              aria-label="Remove image"
              onClick={handleClear}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </div>

          <Button
            variant="text"
            className={styles.validateBtn}
            data-testid="validate-ai"
            disabled={isValidating}
            onClick={handleValidate}
          >
            {isValidating ? 'Validating…' : 'Validate with AI'}
          </Button>

          {detectedSongs && (
            <div className={styles.resultsList}>
              <p className={styles.resultsCount}>AI detected these songs — confirm before adding:</p>
              {detectedSongs.map((song) => (
                <div key={song.id} className={styles.detectedRow}>
                  <div className={styles.info}>
                    <p className={styles.title}>{song.title}</p>
                    <p className={styles.meta}>{song.artist}</p>
                  </div>
                  <span style={{ color: confidenceColor(song.confidence), fontSize: '11px', fontWeight: 700 }}>
                    {song.confidence}%
                  </span>
                  <Button
                    variant="text"
                    className={styles.addBtn}
                    data-testid="add-detected-song"
                    disabled={addedIds.has(song.id)}
                    onClick={() => handleAdd(song)}
                  >
                    {addedIds.has(song.id) ? '✓' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!detectedSongs && !isValidating && (
            <p className={styles.emptyHint}>Click "Validate with AI" to detect songs from this screenshot</p>
          )}
        </div>
      )}
    </div>
  );
}
