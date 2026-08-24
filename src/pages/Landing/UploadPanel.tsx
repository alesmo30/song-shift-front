import { useState, type ChangeEvent, type DragEvent } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import type { Song } from '../../types/song';
import styles from './Landing.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDetected, setStatus, setError as setSongsError } from '../../store/features/songsSlice';
import { extractSongs } from '../../api/songs.service';

const MAX_FILES = 5;

interface UploadPanelProps {
  onValidateWithAI?: (images: File[]) => void;
  onAddSong?: (song: Song) => void;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'var(--color-spotify)';
  if (confidence >= 75) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function UploadPanel({ onValidateWithAI, onAddSong }: UploadPanelProps) {
  const dispatch = useAppDispatch();
  const { detected, status, error } = useAppSelector((state) => state.songs);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const isValidating = status === 'extracting';

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);

    if (previews.length + incoming.length > MAX_FILES) {
      setFileError(`You can upload up to ${MAX_FILES} screenshots at a time.`);
      return;
    }

    setFileError(null);
    incoming.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews((prev) => [...prev, { file, previewUrl: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleValidate = async () => {
    if (previews.length === 0) return;
    const files = previews.map((p) => p.file);

    if (onValidateWithAI) {
      onValidateWithAI(files);
    } else {
      console.log('onValidateWithAI not implemented', files);
    }

    dispatch(setStatus('extracting'));
    dispatch(setSongsError(null));

    try {
      const { songs } = await extractSongs(files);
      dispatch(setDetected(songs));
    } catch {
      dispatch(setSongsError('Could not validate screenshots. Please try again.'));
    } finally {
      dispatch(setStatus('idle'));
    }
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
      {previews.length === 0 && (
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            data-testid="upload-input"
            onChange={handleFileChange}
            className={styles.dropZoneInput}
          />
          <p className={styles.emptyTitle}>Drop your Apple Music screenshots</p>
          <p className={styles.emptyHint}>or click to browse — up to {MAX_FILES} at once, PNG/JPG supported</p>
        </div>
      )}

      {fileError && previews.length === 0 && (
        <p className="t-error-text" data-testid="upload-file-error">
          {fileError}
        </p>
      )}

      {previews.length > 0 && (
        <div className={styles.uploadedWrap}>
          <div className={styles.thumbGrid}>
            {previews.map((p, index) => (
              <div key={index} className={styles.thumb} style={{ backgroundImage: `url(${p.previewUrl})` }}>
                <IconButton
                  className={styles.clearBtn}
                  data-testid={`clear-image-${index}`}
                  aria-label="Remove image"
                  onClick={() => handleRemove(index)}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </div>
            ))}
            {previews.length < MAX_FILES && (
              <label className={styles.thumbAddTile}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  data-testid="upload-input-more"
                  onChange={handleFileChange}
                  className={styles.thumbAddInput}
                />
                <AddIcon sx={{ fontSize: 18 }} />
              </label>
            )}
          </div>

          {fileError && (
            <p className="t-error-text" data-testid="upload-file-error">
              {fileError}
            </p>
          )}
          {error && (
            <p className="t-error-text" data-testid="upload-api-error">
              {error}
            </p>
          )}

          <Button
            variant="text"
            className={styles.validateBtn}
            data-testid="validate-ai"
            disabled={isValidating}
            onClick={handleValidate}
          >
            {isValidating ? 'Validating…' : 'Validate with AI'}
          </Button>

          {detected.length > 0 && (
            <div className={styles.resultsList}>
              <p className={styles.resultsCount}>AI detected these songs — confirm before adding:</p>
              {detected.map((song) => (
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

          {detected.length === 0 && !isValidating && (
            <p className={styles.emptyHint}>Click "Validate with AI" to detect songs from these screenshots</p>
          )}
        </div>
      )}
    </div>
  );
}
