/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable jsx-a11y/label-has-associated-control */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import './App.css';
import './fileicon.css';
import { Switch } from '@/components/ui/switch';
import { FileDef, FileInfo } from '../main/providers/base';
import extensionList from '../extensionList.json';
import AutoCompleteDropdown from './AutoCompleteDropdown';
import { Label } from '../../components/ui/label';
// import 'tailwindcss/tailwind.css';

interface FileExtension {
  name: string;
  extension: string;
}

interface Option {
  value: string;
  label: string;
}

export default function App() {
  const [fileList, setFileList] = useState<FileDef[]>([]);

  const [selectedFileExtension, _setSelectedFileExtension] =
    useState<Option | null>(null);
  const [selectedFileVariant, _setSelectedFileVariant] =
    useState<Option | null>(null);
  const [randomFileName, _setRandomFileName] = useState(false);

  const setSelectedFileExtension = (value: Option | null) => {
    window.electron.setConfig('selectedFileExtension', value);
    _setSelectedFileExtension(value);
  };
  const setSelectedFileVariant = (value: Option | null) => {
    window.electron.setConfig('selectedFileVariant', value);
    _setSelectedFileVariant(value);
  };
  const setRandomFileName = (value: boolean) => {
    window.electron.setConfig('randomFileName', value);
    _setRandomFileName(value);
  };

  const fileExtensionsList = useMemo<FileExtension[]>(() => {
    const uniqueExtensions = new Set<string>();
    fileList.forEach((file) => {
      const lastDotIndex = file.name?.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        uniqueExtensions.add(file.name.substring(lastDotIndex));
      }
    });
    return Array.from(uniqueExtensions).map((extension) => ({
      extension,
      name:
        (extensionList as Record<string, string>)[extension] ||
        extension.substring(1).toUpperCase(),
    }));
  }, [fileList]);

  const filesWithSelectedExtension = useMemo<FileDef[]>(
    () =>
      selectedFileExtension?.value
        ? fileList.filter((file) =>
            file.name.endsWith(selectedFileExtension.value),
          )
        : [],
    [fileList, selectedFileExtension],
  );

  const selectedFile = useMemo<FileDef>(
    () =>
      filesWithSelectedExtension.find(
        (file) =>
          selectedFileExtension?.value &&
          file.name.endsWith(selectedFileExtension.value) &&
          file.id === selectedFileVariant?.value,
      ) || filesWithSelectedExtension[0],
    [filesWithSelectedExtension, selectedFileExtension, selectedFileVariant],
  );

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);

  const fileFormatOptions = fileExtensionsList.map((e) => ({
    value: e.extension,
    label: `${e.extension} - ${e.name}`,
  }));

  const fileVariantOptions = filesWithSelectedExtension.map((file) => ({
    value: file.id,
    label: `${file.name} (${file.provider})`,
  }));

  useEffect(() => {
    if (selectedFile) {
      window.electron
        .getFileInfo(selectedFile)
        .then((info: FileInfo) => setFileInfo(info));
    }
  }, [selectedFile]);

  useEffect(() => {
    window.electron.getAllFiles().then((files: any) => {
      setFileList(files);
    });
  }, []);

  useEffect(() => {
    window.electron
      .getConfig('selectedFileExtension')
      .then((option: Option) => {
        _setSelectedFileExtension(
          fileFormatOptions.find((o) => o.value === option?.value) ?? null,
        );
      });
    window.electron.getConfig('selectedFileVariant').then((option: Option) => {
      _setSelectedFileVariant(
        fileVariantOptions.find((o) => o.value === option?.value) ?? null,
      );
    });
    window.electron.getConfig('randomFileName').then((value: boolean) => {
      _setRandomFileName(value);
    });
  }, [fileList]);

  return (
    <div className="p-4 space-y-4">
      <div className="form-group space-y-2">
        <Label htmlFor="fileExtension">File Format</Label>
        <AutoCompleteDropdown
          itemList={fileExtensionsList.map((e) => ({
            value: e.extension,
            label: `${e.extension} - ${e.name}`,
          }))}
          value={selectedFileExtension}
          placeholder="Select a file format"
          onChange={(e) => setSelectedFileExtension(e)}
        />
      </div>
      <div className="form-group space-y-2">
        <Label htmlFor="fileVariant">File Variant</Label>
        <AutoCompleteDropdown
          itemList={filesWithSelectedExtension.map((file) => ({
            value: file.id,
            label: `${file.name} (${file.provider})`,
          }))}
          value={selectedFileVariant}
          placeholder="Select a file variant"
          onChange={(e) => setSelectedFileVariant(e)}
        />
      </div>
      <div className="flex space-x-2">
        <Switch
          id="randomFileName"
          checked={randomFileName}
          onCheckedChange={(e) => setRandomFileName(e)}
        />
        <Label htmlFor="randomFileName">Use Random File Name</Label>
      </div>

      {selectedFile ? (
        <div style={{ flexDirection: 'row', display: 'flex' }}>
          <div
            style={{ width: '100px', flex: 0 }}
            className="file-icon"
            draggable
            onDragStart={(event) => {
              event.preventDefault();
              window.electron.startDrag(selectedFile);
            }}
          >
            <div
              className="file-icon file-icon-lg"
              data-type={selectedFileExtension?.value.substring(1)}
            />
          </div>
          <div style={{ flex: 1, marginLeft: '10px', fontSize: '14px' }}>
            <p style={{ margin: '0 0 5px' }}>
              <strong>Name:</strong> {selectedFile.name}
            </p>
            <p style={{ margin: '0 0 5px' }}>
              <strong>Size:</strong> {fileInfo?.size} bytes
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
