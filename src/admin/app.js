export default {
  bootstrap(app) {
    // 状態管理変数
    let originalConfirm = null;
    let uploadButtonAdded = false;
    let lastPathname = window.location.pathname;
    let mediaLibraryCheckerInterval = null;

    // window.confirmをオーバーライドして警告表示を防止
    const setupConfirmOverride = () => {
      if (originalConfirm === null) {
        originalConfirm = window.confirm;
        window.confirm = function(message) {
          if (message && message.includes('not been uploaded yet')) {
            return true;
          }
          return originalConfirm.apply(this, arguments);
        };
      }
    };

    // セッションストレージからトークンを取得する関数
    const getAuthTokenFromSessionStorage = () => {
      try {
        const rawToken = sessionStorage.getItem('jwtToken');
        if (!rawToken) return null;
        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          try {
            return JSON.parse(rawToken);
          } catch {
            return rawToken;
          }
        }
        return rawToken;
      } catch {
        return null;
      }
    };

    // ページ遷移を検出する関数
    const setupNavigationDetection = () => {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleUrlChange();
      };
      history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleUrlChange();
      };
      window.addEventListener('popstate', handleUrlChange);
      function handleUrlChange() {
        const currentPath = window.location.pathname;
        if ((currentPath.includes('/media-library') || currentPath.includes('/upload')) && currentPath !== lastPathname) {
          uploadButtonAdded = false;
          setTimeout(() => {
            hideOriginalAddNewAssetsButton();
            removeAddNewAssetsButton();
            addUploadButtonNextToAddNewFolder();
          }, 500);
        }
        lastPathname = currentPath;
      }
      // メディアライブラリページ検出
      const setupMediaLibraryChecker = () => {
        if (mediaLibraryCheckerInterval) clearInterval(mediaLibraryCheckerInterval);
        mediaLibraryCheckerInterval = setInterval(() => {
          const isMediaLibraryPage = document.title.includes('Media Library') ||
            document.querySelector('[data-testid="media-library-main-actions"]') ||
            document.querySelector('.media-library') ||
            document.location.pathname.includes('/media-library') ||
            document.location.pathname.includes('/upload');
          if (isMediaLibraryPage && !uploadButtonAdded) {
            hideOriginalAddNewAssetsButton();
            removeAddNewAssetsButton();
            addUploadButtonNextToAddNewFolder();
          }
        }, 1000);
      };
      setupMediaLibraryChecker();
    };

    // 「Add new assets」「Add more assets」ボタンを非表示にする
    const hideOriginalAddNewAssetsButton = () => {
      const styleId = 'hide-original-button-style';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
          button span:contains('Add new assets'),
          button:contains('Add new assets'),
          button[aria-label*="add new asset"],
          button[aria-label*="upload"],
          button:has(> span:contains('Add new assets')),
          button span:contains('Add more assets'),
          button:contains('Add more assets'),
          button:has(> span:contains('Add more assets')),
          [data-strapi-header-action="add-assets"] {
            display: none !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
      const findAndHideButtons = () => {
        document.querySelectorAll('button').forEach(button => {
          if (button.textContent && (button.textContent.includes('Add new assets') || button.textContent.includes('Add more assets'))) {
            button.style.display = 'none';
          }
        });
        document.querySelectorAll('button span').forEach(span => {
          if (span.textContent && (span.textContent.includes('Add new assets') || span.textContent.includes('Add more assets'))) {
            const button = span.closest('button');
            if (button) button.style.display = 'none';
          }
        });
        document.querySelectorAll('button[aria-label*="add new asset"], button[aria-label*="add more asset"]').forEach(button => {
          button.style.display = 'none';
        });
        document.querySelectorAll('button[data-for*="asset"], button[id*="asset"], [data-strapi-header-action="add-assets"]').forEach(button => {
          if (button.textContent && button.textContent.toLowerCase().includes('add')) {
            button.style.display = 'none';
          }
        });
        const mediaLibDialogs = document.querySelectorAll('.media-dialog, [role="dialog"], .ReactModal__Content');
        mediaLibDialogs.forEach(dialog => {
          dialog.querySelectorAll('button').forEach(button => {
            if (button.textContent && (button.textContent.includes('Add new assets') || button.textContent.includes('Add more assets'))) {
              button.style.display = 'none';
            }
          });
        });
      };
      findAndHideButtons();
      setInterval(findAndHideButtons, 2000);
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) findAndHideButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const setupModalObserver = () => {
        const modalObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
              const addedNodes = Array.from(mutation.addedNodes);
              for (const node of addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.classList && (
                    node.classList.contains('ReactModal__Content') ||
                    node.classList.contains('dialog') ||
                    node.getAttribute('role') === 'dialog')) {
                    setTimeout(findAndHideButtons, 100);
                  }
                  if (node.querySelectorAll) {
                    const modals = node.querySelectorAll('.ReactModal__Content, .dialog, [role="dialog"]');
                    if (modals.length > 0) setTimeout(findAndHideButtons, 100);
                  }
                }
              }
            }
          });
        });
        modalObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        return modalObserver;
      };
      setupModalObserver();
    };

    // 「Add new assets」「Add more assets」ボタンを直接削除する
    const removeAddNewAssetsButton = () => {
      const removeInterval = setInterval(() => {
        const buttons = document.querySelectorAll('button');
        let found = false;
        for (const button of buttons) {
          if (button.textContent && (button.textContent.includes('Add new assets') || button.textContent.includes('Add more assets'))) {
            if (button.parentNode) {
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        }
        document.querySelectorAll('button span').forEach(span => {
          if (span.textContent && (span.textContent.includes('Add new assets') || span.textContent.includes('Add more assets'))) {
            const button = span.closest('button');
            if (button && button.parentNode) {
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        });
        document.querySelectorAll('.ReactModal__Content button, [role="dialog"] button, .dialog button').forEach(button => {
          if (button.textContent && (button.textContent.includes('Add new assets') || button.textContent.includes('Add more assets'))) {
            if (button.parentNode) {
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        });
        if (found) clearInterval(removeInterval);
      }, 1000);
      setTimeout(() => clearInterval(removeInterval), 10000);
    };

    // 独自のアップロードインターフェースを作成
    const createCustomUploadInterface = () => {
      const existingInterface = document.getElementById('standalone-upload-interface');
      if (existingInterface) document.body.removeChild(existingInterface);
      const iframe = document.createElement('iframe');
      iframe.id = 'standalone-upload-interface';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.backgroundColor = 'rgba(33, 33, 52, 0.7)';
      iframe.style.zIndex = '2147483647';
      document.body.appendChild(iframe);
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      iframeDocument.open();
      iframeDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ファイルアップロード</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: rgba(33, 33, 52, 0.7);}
            .upload-container {background-color: white; border-radius: 4px; box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2); width: 600px; max-width: 90%; overflow: hidden;}
            .upload-header {padding: 24px 24px 10px 24px; border-bottom: 1px solid #f0f0f0;}
            .upload-header h2 {margin: 0; font-size: 1.5rem; color: #32324d; font-weight: 600;}
            .upload-body {padding: 20px 24px; max-height: 70vh; overflow-y: auto;}
            .upload-footer {padding: 16px 24px; border-top: 1px solid #f0f0f0; display: flex; justify-content: flex-end; gap: 8px;}
            .file-input-container {border: 2px dashed #dcdce4; border-radius: 4px; padding: 40px 20px; text-align: center; margin-bottom: 20px; cursor: pointer;}
            .file-input-container:hover {border-color: #4945ff;}
            .file-input {display: none;}
            .button {padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none;}
            .primary-button {background-color: #4945ff; color: white;}
            .secondary-button {background-color: white; border: 1px solid #dcdce4; color: #32324d;}
            .file-list {margin-top: 20px; max-height: 200px; overflow-y: auto;}
            .file-item {display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background-color: #f6f6f9; border-radius: 4px; margin-bottom: 4px;}
            .file-item-name {flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
            .file-item-remove {cursor: pointer; color: #d02b20; margin-left: 8px;}
            .upload-progress {margin-top: 20px; display: none;}
            .progress-bar {height: 4px; background-color: #dcdce4; border-radius: 2px; overflow: hidden;}
            .progress-fill {height: 100%; background-color: #4945ff; width: 0%; transition: width 0.3s;}
            .error-message {color: #d02b20; margin-top: 8px; font-size: 14px;}
            .success-message {color: #2da44e; margin-top: 8px; font-size: 14px;}
            .existing-file-alert {background-color: #fdf4f3; border: 1px solid #fae2e0; border-left: 4px solid #d02b20; padding: 12px; margin-top: 20px; border-radius: 4px;}
            .existing-file-message {color: #32324d; margin-bottom: 16px;}
            .existing-file-list {list-style-type: none; padding: 0; margin: 0;}
            .existing-file-item {background-color: #f6f6f9; border-radius: 4px; padding: 10px; margin-bottom: 8px; font-size: 14px; line-height: 1.5;}
            .warning-icon {margin-right: 8px; font-size: 16px;}
            .hidden {display: none;}
            .warning-text {color: #d02b20; font-weight: 900;}
          </style>
        </head>
        <body>
          <div class="upload-container">
            <div class="upload-header">
              <h2>ファイルアップロード</h2>
            </div>
            <div class="upload-body">
              <div class="file-input-container" id="dropZone">
                <p>ファイルをドラッグ＆ドロップするか、<br />クリックして選択してください</p>
                <input type="file" class="file-input" id="fileInput" multiple>
              </div>
              <div id="fileList" class="file-list"></div>
              <div id="uploadProgress" class="upload-progress">
                <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
                <p id="progressText">0%</p>
              </div>
              <div id="errorMessage" class="error-message"></div>
              <div id="successMessage" class="success-message"></div>
              <div id="existingFileAlert" class="existing-file-alert hidden">
                <div class="existing-file-message">
                  以下のファイルがすでに存在するため、<span class="warning-text">APIでのアクセス時に利用可能なファイルが上書きされます。</span><br />
                  アップロードを継続してもよろしいでしょうか？
                </div>
                <ul id="existingFileList" class="existing-file-list"></ul>
              </div>
            </div>
            <div class="upload-footer">
              <button id="cancelButton" class="button secondary-button">キャンセル</button>
              <button id="uploadButton" class="button primary-button">アップロード</button>
            </div>
          </div>
          <script>
            // ファイルサイズを10進換算（1000で区切る）で表示（PC/DB/APIと一致）
            function formatFileSizeFromBytesSI(bytes) {
              if (!bytes || isNaN(bytes) || bytes < 0) return '0 Bytes';
              if (bytes < 1000) return bytes + ' Bytes';
              if (bytes < 1_000_000) return Math.round(bytes / 1000) + ' KB';
              return (bytes / 1_000_000).toFixed(1) + ' MB';
            }
            // KBとMBの判定は1000で割った結果の小数点以上があるかどうかで判定（既存ファイル警告用）
            function formatFileSizeForExistingFile(size) {
              let sizeNum = Number(size);
              if (isNaN(sizeNum) || sizeNum == null) return '0 Bytes';
               if (sizeNum < 1000) return sizeNum.toFixed(0) + ' KB';
               const kb = sizeNum / 1000;
               return kb.toFixed(1) + ' MB';
            }
            function formatDateToJST(dateString) {
              const date = new Date(dateString);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
            }
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');
            const fileList = document.getElementById('fileList');
            const uploadButton = document.getElementById('uploadButton');
            const cancelButton = document.getElementById('cancelButton');
            const uploadProgress = document.getElementById('uploadProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            const existingFileAlert = document.getElementById('existingFileAlert');
            const existingFileList = document.getElementById('existingFileList');
            let selectedFiles = [];
            let existingFiles = [];
            let forceUpload = false;
            uploadButton.disabled = true;
            dropZone.addEventListener('click', () => { fileInput.click(); });
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#4945ff'; });
            dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#dcdce4'; });
            dropZone.addEventListener('drop', (e) => {
              e.preventDefault();
              dropZone.style.borderColor = '#dcdce4';
              if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', () => { handleFiles(fileInput.files); fileInput.value = ''; });
            function handleFiles(files) {
              for (const file of files) {
                if (!selectedFiles.some(f => f.name === file.name)) {
                  selectedFiles.push(file);
                  addFileToList(file);
                }
              }
              if (selectedFiles.length > 0) uploadButton.disabled = false;
            }
            function addFileToList(file) {
              const fileItem = document.createElement('div');
              fileItem.className = 'file-item';
              const fileName = document.createElement('span');
              fileName.className = 'file-item-name';
              fileName.textContent = file.name;
              const fileSize = document.createElement('span');
              fileSize.textContent = formatFileSizeFromBytesSI(file.size);
              const removeButton = document.createElement('span');
              removeButton.className = 'file-item-remove';
              removeButton.textContent = '×';
              removeButton.onclick = () => {
                fileItem.remove();
                selectedFiles = selectedFiles.filter(f => f !== file);
                if (selectedFiles.length === 0) uploadButton.disabled = true;
              };
              fileItem.appendChild(fileName);
              fileItem.appendChild(fileSize);
              fileItem.appendChild(removeButton);
              fileList.appendChild(fileItem);
            }
            uploadButton.addEventListener('click', async () => {
              if (selectedFiles.length === 0) return;
              try {
                if (uploadButton.textContent === 'このままアップロード') {
                  forceUpload = true;
                  existingFileAlert.classList.add('hidden');
                }
                if (!forceUpload) {
                  const existingFilesResult = await checkExistingFiles();
                  if (existingFilesResult.length > 0) {
                    existingFiles = existingFilesResult;
                    displayExistingFiles(existingFiles);
                    existingFileAlert.classList.remove('hidden');
                    uploadButton.textContent = 'このままアップロード';
                    return;
                  }
                }
                uploadProgress.style.display = 'block';
                uploadButton.disabled = true;
                errorMessage.textContent = '';
                successMessage.textContent = '';
                await uploadFiles();
                successMessage.textContent = 'ファイルが正常にアップロードされました';
                setTimeout(() => {
                  window.parent.postMessage({ type: 'UPLOAD_COMPLETE', success: true }, '*');
                }, 1000);
              } catch (error) {
                errorMessage.textContent = 'アップロード中にエラーが発生しました: ' + error.message;
                uploadButton.disabled = false;
              }
            });
            function displayExistingFiles(files) {
              existingFileList.innerHTML = '';
              files.forEach(file => {
                const updateDate = formatDateToJST(file.updatedAt);
                const updater = file.updatedBy ? file.updatedBy.lastname + ' ' + file.updatedBy.firstname : '不明';
                const fileSize = formatFileSizeForExistingFile(file.size);
                const listItem = document.createElement('li');
                listItem.className = 'existing-file-item';
                listItem.innerHTML = 'ファイル名: ' + file.name + ' <br />最終更新日時: ' + updateDate + ' <br />最終更新者: ' + updater + ' <br />ファイルサイズ: ' + fileSize;
                existingFileList.appendChild(listItem);
              });
              uploadButton.textContent = 'このままアップロード';
            }
            cancelButton.addEventListener('click', () => {
              window.parent.postMessage({ type: 'UPLOAD_CANCELLED' }, '*');
            });
            async function checkExistingFiles() {
              try {
                const token = await new Promise(resolve => {
                  window.parent.postMessage({ type: 'GET_AUTH_TOKEN' }, '*');
                  window.addEventListener('message', function handler(event) {
                    if (event.data.type === 'AUTH_TOKEN_RESPONSE') {
                      window.removeEventListener('message', handler);
                      resolve(event.data.token);
                    }
                  });
                });
                if (!token) throw new Error('認証トークンが取得できませんでした');
                const fileNames = selectedFiles.map(file => file.name);
                const queryParams = new URLSearchParams();
                fileNames.forEach((name, index) => {
                  queryParams.append('filters[name][$in]['+index+']', name);
                });
                queryParams.append('populate', '*');
                queryParams.append('sort', 'updatedAt:desc');
                const response = await fetch(window.location.origin + '/upload/files?' + queryParams.toString(), {
                  method: 'GET',
                  headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                  }
                });
                if (!response.ok) throw new Error('API エラー: ' + response.status);
                const data = await response.json();
                const allFiles = data.results || data || [];
                const latestFiles = [];
                const processedFileNames = new Set();
                allFiles.forEach(file => {
                  if (!processedFileNames.has(file.name)) {
                    processedFileNames.add(file.name);
                    latestFiles.push(file);
                  }
                });
                return latestFiles;
              } catch (error) {
                return [];
              }
            }
            async function uploadFiles() {
              try {
                const token = await new Promise(resolve => {
                  window.parent.postMessage({ type: 'GET_AUTH_TOKEN' }, '*');
                  window.addEventListener('message', function handler(event) {
                    if (event.data.type === 'AUTH_TOKEN_RESPONSE') {
                      window.removeEventListener('message', handler);
                      resolve(event.data.token);
                    }
                  });
                });
                if (!token) throw new Error('認証トークンが取得できませんでした');
                const formData = new FormData();
                selectedFiles.forEach(file => {
                  formData.append('files', file);
                });
                return new Promise((resolve, reject) => {
                  const xhr = new XMLHttpRequest();
                  xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                      const percentComplete = Math.round((event.loaded / event.total) * 100);
                      progressFill.style.width = percentComplete + '%';
                      progressText.textContent = percentComplete + '%';
                    }
                  });
                  xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                      resolve(JSON.parse(xhr.responseText));
                    } else {
                      reject(new Error('HTTP エラー: ' + xhr.status));
                    }
                  });
                  xhr.addEventListener('error', () => {
                    reject(new Error('ネットワークエラーが発生しました'));
                  });
                  xhr.open('POST', window.location.origin + '/upload');
                  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                  xhr.send(formData);
                });
              } catch (error) {
                throw error;
              }
            }
            window.addEventListener('message', (event) => {
              if (event.data.type === 'FORCE_UPLOAD') {
                forceUpload = true;
                existingFileAlert.classList.add('hidden');
                uploadButton.click();
              }
            });
          </script>
        </body>
        </html>
      `);
      iframeDocument.close();
      window.addEventListener('message', (event) => {
        if (event.data.type === 'GET_AUTH_TOKEN') {
          const token = getAuthTokenFromSessionStorage();
          if (token) event.source.postMessage({ type: 'AUTH_TOKEN_RESPONSE', token }, '*');
        } else if (event.data.type === 'UPLOAD_CANCELLED') {
          document.body.removeChild(iframe);
        } else if (event.data.type === 'UPLOAD_COMPLETE') {
          document.body.removeChild(iframe);
          setTimeout(() => { window.location.reload(); }, 500);
        }
      });
      return iframe;
    };

    // 「Add new folder」の隣に「Upload」ボタンを追加
    const addUploadButtonNextToAddNewFolder = () => {
      if (uploadButtonAdded) return;
      const findAddNewFolderButton = () => {
        const spanElements = document.querySelectorAll('button span');
        for (const span of spanElements) {
          if (span.textContent && span.textContent.includes('Add new folder')) return span.closest('button');
        }
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent && button.textContent.includes('Add new folder')) return button;
        }
        const svgButtons = document.querySelectorAll('button svg');
        for (const svg of svgButtons) {
          const button = svg.closest('button');
          if (button && button.offsetParent !== null) {
            const ariaLabel = button.getAttribute('aria-label') || '';
            const title = button.getAttribute('title') || '';
            if (ariaLabel.includes('folder') || title.includes('folder')) return button;
          }
        }
        const toolbars = document.querySelectorAll('[data-testid="media-library-main-actions"], .media-library-actions');
        if (toolbars.length > 0) {
          const toolbarButtons = toolbars[0].querySelectorAll('button');
          if (toolbarButtons.length > 0) return toolbarButtons[toolbarButtons.length - 1];
        }
        const headers = document.querySelectorAll('header, [role="region"], [class*="header"]');
        for (const header of headers) {
          const headerButtons = header.querySelectorAll('button');
          if (headerButtons.length > 0) return headerButtons[headerButtons.length - 1];
        }
        return null;
      };
      const createUploadButton = () => {
        const uploadButton = document.createElement('button');
        uploadButton.id = 'custom-upload-button';
        uploadButton.textContent = 'Upload';
        Object.assign(uploadButton.style, {
          padding: '8px 16px',
          borderRadius: '4px',
          backgroundColor: '#4945ff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          marginLeft: '8px',
          fontSize: '14px'
        });
        uploadButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          createCustomUploadInterface();
        });
        return uploadButton;
      };
      const addButtons = () => {
        const folderButton = findAddNewFolderButton();
        if (folderButton) {
          if (document.getElementById('custom-upload-button')) {
            uploadButtonAdded = true;
            return true;
          }
          const uploadButton = createUploadButton();
          const parentElement = folderButton.parentElement;
          if (parentElement) {
            parentElement.insertBefore(uploadButton, folderButton.nextSibling);
            uploadButtonAdded = true;
            return true;
          }
        }
        return false;
      };
      let attempts = 0;
      const maxAttempts = 20;
      const addButtonInterval = setInterval(() => {
        attempts++;
        if (addButtons() || attempts >= maxAttempts) {
          clearInterval(addButtonInterval);
          if (attempts >= maxAttempts && !uploadButtonAdded) addFloatingActionButton();
        }
      }, 1000);
      const observer = new MutationObserver((mutations) => {
        if (uploadButtonAdded && !document.getElementById('custom-upload-button')) {
          uploadButtonAdded = false;
          addButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    // フローティングアクションボタン
    const addFloatingActionButton = () => {
      const existingFAB = document.getElementById('custom-upload-fab');
      if (existingFAB) document.body.removeChild(existingFAB);
      const fab = document.createElement('button');
      fab.id = 'custom-upload-fab';
      fab.innerHTML = '<strong>+</strong>';
      fab.title = 'ファイルをアップロード';
      Object.assign(fab.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#4945ff',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        fontSize: '24px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: '1000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      fab.addEventListener('mouseenter', () => { fab.style.backgroundColor = '#3c3adb'; });
      fab.addEventListener('mouseleave', () => { fab.style.backgroundColor = '#4945ff'; });
      fab.addEventListener('click', () => { createCustomUploadInterface(); });
      document.body.appendChild(fab);
      return fab;
    };

    // 起動処理
    setupConfirmOverride();
    hideOriginalAddNewAssetsButton();
    removeAddNewAssetsButton();
    addUploadButtonNextToAddNewFolder();
    setupNavigationDetection();
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        createCustomUploadInterface();
      }
    });
    setInterval(() => {
      hideOriginalAddNewAssetsButton();
    }, 3000);
  }
};
