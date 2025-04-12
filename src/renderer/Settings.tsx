/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { FileProviderProps } from '../main/providers/base';

export default function Settings() {
  const [fileProviders, _setFileProviders] = useState<FileProviderProps[]>([]);
  const [tempFileLocation, _setTempFileLocation] = useState<string | null>('');
  // const [tempDirSizeLimit, _setTempDirSizeLimit] = useState<string | null>('');
  const [shortcut, _setShortcut] = useState<string | null>('');

  const setTempFileLocation = (value: string | null) => {
    window.electron.setConfig('tempFileLocation', value);
    _setTempFileLocation(value);
  };
  const setFileProviders = (value: FileProviderProps[]) => {
    window.electron.setConfig('fileProviders', value);
    _setFileProviders(value);
  };
  // const setTempDirSizeLimit = (value: string | null) => {
  //   window.electron.setConfig('tempDirSizeLimit', value);
  //   _setTempDirSizeLimit(value);
  // };
  const setShortcut = (value: string | null) => {
    window.electron.setConfig('shortcut', value);
    _setShortcut(value);
  };

  useEffect(() => {
    window.electron.getConfig('tempFileLocation').then((value: string) => {
      if (value) _setTempFileLocation(value);
    });
    window.electron
      .getConfig('fileProviders')
      .then((value: FileProviderProps[]) => {
        if (value) _setFileProviders(value);
      });
    // window.electron.getConfig('tempDirSizeLimit').then((value: string) => {
    //   if (value) _setTempDirSizeLimit(value);
    // });
    window.electron.getConfig('shortcut').then((value: string) => {
      if (value) _setShortcut(value);
    });
  }, []);

  const handleAddProvider = () => {
    setFileProviders([...fileProviders, { type: 'local', sourceName: '' }]);
  };

  const handleProviderChange = (index: number, key: string, value: string) => {
    const updatedProviders = [...fileProviders];
    updatedProviders[index] = { ...updatedProviders[index], [key]: value };
    setFileProviders(updatedProviders);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="form-group space-y-2">
        <Label htmlFor="fileProviders">File Providers</Label>
        <div id="fileProviders">
          {fileProviders.map((provider, index) => (
            <div key={`${provider.type}-${index}`} className="space-y-2 mb-2">
              <Select
                onValueChange={(value) =>
                  handleProviderChange(index, 'type', value)
                }
                value={provider.type}
                defaultValue={'local' as const}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>{' '}
              <Input
                type="text"
                placeholder="Source Name"
                value={provider.sourceName || ''}
                onChange={(e) =>
                  handleProviderChange(index, 'sourceName', e.target.value)
                }
              />
              {provider.type === 'github' ? (
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="GitHub Username"
                    value={provider.userName || ''}
                    onChange={(e) =>
                      handleProviderChange(index, 'userName', e.target.value)
                    }
                  />
                  <Input
                    type="text"
                    placeholder="Repository Name"
                    value={provider.repoName || ''}
                    onChange={(e) =>
                      handleProviderChange(index, 'repoName', e.target.value)
                    }
                  />
                </div>
              ) : (
                <Input
                  type="text"
                  placeholder="Root Folder"
                  value={provider.basePath || ''}
                  readOnly
                  onClick={() => {
                    window.electron
                      .selectFolder()
                      .then((path: string) => {
                        if (path) {
                          handleProviderChange(index, 'basePath', path);
                        }
                      })
                      .catch((error) => {
                        console.error('Error selecting folder:', error);
                      });
                  }}
                  style={{
                    cursor: 'pointer',
                  }}
                />
              )}
            </div>
          ))}
          <Button type="button" onClick={handleAddProvider}>
            Add Provider
          </Button>
        </div>
      </div>
      <div className="form-group space-y-2">
        <Label htmlFor="tempFileLocation">Temp File Location</Label>
        <Input
          id="tempFileLocation"
          type="text"
          readOnly
          onClick={() => {
            window.electron
              .selectFolder()
              .then((path: string) => {
                if (path) {
                  return setTempFileLocation(path);
                }
              })
              .catch((error) => {
                console.error('Error selecting folder:', error);
              });
          }}
          style={{
            cursor: 'pointer',
          }}
          value={tempFileLocation ?? ''}
          placeholder="Click to select a folder"
        />
      </div>
      {/* <div className="form-group space-y-2">
        <Label htmlFor="tempDirSizeLimit">Temp Dir Size Limit</Label>
        <Input
          id="tempDirSizeLimit"
          type="number"
          placeholder="Enter size limit (e.g., 500MB)"
          value={tempDirSizeLimit ?? ''}
          onChange={(e) => setTempDirSizeLimit(e.target.value)}
        />
      </div> */}
      <div className="form-group space-y-2">
        <Label htmlFor="shortcut">Shortcut</Label>
        <div className="flex w-full space-x-2">
          <Input
            id="shortcut"
            type="text"
            placeholder="Enter shortcut"
            disabled
            value={shortcut ?? ''}
            onChange={(e) => setShortcut(e.target.value)}
          />
          <Button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget
                .previousElementSibling as HTMLInputElement;
              const button = e.currentTarget;
              input.value = 'Press keys...';
              button.style.display = 'none';

              const handleKeyDown = (event: KeyboardEvent) => {
                const keys = [];
                if (event.ctrlKey) keys.push('Ctrl');
                if (event.shiftKey) keys.push('Shift');
                if (event.altKey) keys.push('Alt');
                if (event.metaKey) keys.push('Command');
                if (
                  event.key === 'Meta' ||
                  event.key === 'Control' ||
                  event.key === 'Shift' ||
                  event.key === 'Alt'
                ) {
                  return;
                }
                keys.push(event.key);
                setShortcut(keys.join('+'));
                button.style.display = 'inline-block';
                window.removeEventListener('keydown', handleKeyDown);
              };

              window.addEventListener('keydown', handleKeyDown);
            }}
          >
            Change Shortcut
          </Button>
        </div>
      </div>
    </div>
  );
}
