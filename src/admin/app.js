export default {
  bootstrap(app) {
    // 状態管理変数
    let customButtonAdded = false;
    let originalConfirm = null;
    let uploadButtonAdded = false;
    let lastPathname = window.location.pathname; // 現在のパスを記録
    let mediaLibraryCheckerInterval = null;

    // window.confirmをオーバーライドして警告表示を防止
    const setupConfirmOverride = () => {
      if (originalConfirm === null) {
        originalConfirm = window.confirm;
        window.confirm = function(message) {
          // console.log('確認ダイアログ検出:', message);
          if (message && message.includes('not been uploaded yet')) {
            console.log('Strapi警告ダイアログをブロックしました:', message);
            return true;
          }
          return originalConfirm.apply(this, arguments);
        };
      }
    };

    const restoreConfirmFunction = () => {
      if (originalConfirm) {
        window.confirm = originalConfirm;
        originalConfirm = null;
      }
    };

    // 日付とファイルサイズのフォーマット関数
    const formatDateToJST = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0KB';
      const kb = bytes / 1024;
      return `${kb.toFixed(1)}KB`;
    };

    // セッションストレージからトークンを取得する関数
    const getAuthTokenFromSessionStorage = () => {
      try {
        const rawToken = sessionStorage.getItem('jwtToken');
        // console.log('jwtToken取得状態:', rawToken ? '成功' : '失敗');

        if (!rawToken) return null;

        // JSON文字列のパース処理
        if (rawToken.startsWith('"') && rawToken.endsWith('"')) {
          try {
            return JSON.parse(rawToken);
          } catch (e) {
            console.warn('トークンJSONパースエラー:', e);
            return rawToken;
          }
        }
        return rawToken;
      } catch (e) {
        console.error('トークン取得エラー:', e);
        return null;
      }
    };

    // ページ遷移を検出する関数
    const setupNavigationDetection = () => {
      // console.log('ページ遷移検出機能をセットアップします');

      // 1. History API の変更を監視
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

      // popstate イベントも監視
      window.addEventListener('popstate', handleUrlChange);

      // 2. URL変更時の処理
      function handleUrlChange() {
        const currentPath = window.location.pathname;
        // console.log('URL変更検出:', currentPath);

        // メディアライブラリへの遷移を検出
        if ((currentPath.includes('/media-library') || currentPath.includes('/upload')) &&
          currentPath !== lastPathname) {
          // console.log('メディアライブラリへの遷移を検出しました');

          // フラグをリセット
          uploadButtonAdded = false;

          // 少し遅延させて実行（DOMが更新されるのを待つ）
          setTimeout(() => {
            // Add new assetsボタンを非表示に
            hideOriginalAddNewAssetsButton();
            removeAddNewAssetsButton();

            // Uploadボタンを追加
            addUploadButtonNextToAddNewFolder();
          }, 500);
        }

        // 現在のパスを更新
        lastPathname = currentPath;
      }

      // 3. メディアライブラリページを検出するためのDOM監視
      const setupMediaLibraryChecker = () => {
        // 既存の監視タイマーをクリア
        if (mediaLibraryCheckerInterval) {
          clearInterval(mediaLibraryCheckerInterval);
        }

        mediaLibraryCheckerInterval = setInterval(() => {
          // メディアライブラリページの特徴的な要素を探す
          const isMediaLibraryPage = document.title.includes('Media Library') ||
            document.querySelector('[data-testid="media-library-main-actions"]') ||
            document.querySelector('.media-library') ||
            document.location.pathname.includes('/media-library') ||
            document.location.pathname.includes('/upload');

          if (isMediaLibraryPage && !uploadButtonAdded) {
            // console.log('メディアライブラリページを検出しました');

            // Add new assetsボタンを非表示に
            hideOriginalAddNewAssetsButton();
            removeAddNewAssetsButton();

            // Uploadボタンを追加
            addUploadButtonNextToAddNewFolder();
          }
        }, 1000);
      };

      // 初期化時に監視を開始
      setupMediaLibraryChecker();
    };

    // 元の「Add new assets」および「Add more assets」ボタンを非表示にする関数
    const hideOriginalAddNewAssetsButton = () => {
      // console.log('元の「Add new assets」と「Add more assets」ボタンを非表示にします');

      // CSSを使ってセレクタに一致するボタンを非表示にする
      const styleId = 'hide-original-button-style';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
          /* Add new assets/Add more assetsボタン非表示 */
          button span:contains('Add new assets'),
          button:contains('Add new assets'),
          button[aria-label*="add new asset"],
          button[aria-label*="upload"],
          button:has(> span:contains('Add new assets')),
          /* Add more assetsボタンの非表示 */
          button span:contains('Add more assets'),
          button:contains('Add more assets'),
          button:has(> span:contains('Add more assets')),
          [data-strapi-header-action="add-assets"] {
            display: none !important;
          }
        `;
        document.head.appendChild(styleElement);
      }

      // DOMから直接ボタンを探して非表示にする
      const findAndHideButtons = () => {
        // Add new assets ボタン検出
        document.querySelectorAll('button').forEach(button => {
          if (button.textContent && (button.textContent.includes('Add new assets') ||
            button.textContent.includes('Add more assets'))) {
            // console.log('テキストで「Add new/more assets」ボタンを発見、非表示にします');
            button.style.display = 'none';
          }
        });

        // span内のテキスト検出
        document.querySelectorAll('button span').forEach(span => {
          if (span.textContent && (span.textContent.includes('Add new assets') ||
            span.textContent.includes('Add more assets'))) {
            // console.log('span内テキストで「Add new/more assets」ボタンを発見、非表示にします');
            const button = span.closest('button');
            if (button) button.style.display = 'none';
          }
        });

        // aria-label属性で検索
        document.querySelectorAll('button[aria-label*="add new asset"], button[aria-label*="add more asset"]').forEach(button => {
          // console.log('aria-labelで候補ボタンを発見、非表示にします:', button.getAttribute('aria-label'));
          button.style.display = 'none';
        });

        // 属性やデータ属性で検索
        document.querySelectorAll('button[data-for*="asset"], button[id*="asset"], [data-strapi-header-action="add-assets"]').forEach(button => {
          if (button.textContent && button.textContent.toLowerCase().includes('add')) {
            // console.log('データ属性で「Add assets」ボタンを発見、非表示にします');
            button.style.display = 'none';
          }
        });

        // ダイアログ内のボタンを検出
        const mediaLibDialogs = document.querySelectorAll('.media-dialog, [role="dialog"], .ReactModal__Content');
        mediaLibDialogs.forEach(dialog => {
          dialog.querySelectorAll('button').forEach(button => {
            if (button.textContent && (button.textContent.includes('Add new assets') ||
              button.textContent.includes('Add more assets'))) {
              // console.log('ダイアログ内の「Add assets」ボタンを発見、非表示にします');
              button.style.display = 'none';
            }
          });
        });
      };

      // 初回実行
      findAndHideButtons();

      // 定期的に実行して、動的に追加されるボタンにも対応
      setInterval(findAndHideButtons, 2000);

      // MutationObserverを使用して動的に追加されるボタンを検出して非表示に
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            findAndHideButtons();
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // モーダルダイアログの出現を検知して対応
      const setupModalObserver = () => {
        // モーダル要素のクラスに基づいて監視
        const modalObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
              // モーダルダイアログが追加された可能性がある
              const addedNodes = Array.from(mutation.addedNodes);
              for (const node of addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  // モーダル内のボタンを探して非表示に
                  if (node.classList && (
                    node.classList.contains('ReactModal__Content') ||
                    node.classList.contains('dialog') ||
                    node.getAttribute('role') === 'dialog')) {
                    // console.log('新しいモーダルダイアログを検出');
                    setTimeout(findAndHideButtons, 100); // 少し遅延させて実行
                  }

                  // 子孫要素にモーダルがある可能性もチェック
                  if (node.querySelectorAll) {
                    const modals = node.querySelectorAll('.ReactModal__Content, .dialog, [role="dialog"]');
                    if (modals.length > 0) {
                      // console.log('追加されたノード内にモーダルダイアログを検出');
                      setTimeout(findAndHideButtons, 100);
                    }
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

      // モーダル監視を設定
      setupModalObserver();
    };

    // 「Add new assets」と「Add more assets」ボタンを直接削除する関数
    const removeAddNewAssetsButton = () => {
      // console.log('「Add new assets」と「Add more assets」ボタンを削除します');

      const removeInterval = setInterval(() => {
        // ボタンを検索して削除
        const buttons = document.querySelectorAll('button');
        let found = false;

        for (const button of buttons) {
          if (button.textContent && (button.textContent.includes('Add new assets') ||
            button.textContent.includes('Add more assets'))) {
            // console.log('「Add assets」ボタンを発見、削除します');
            if (button.parentNode) {
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        }

        // spanテキストで検索
        document.querySelectorAll('button span').forEach(span => {
          if (span.textContent && (span.textContent.includes('Add new assets') ||
            span.textContent.includes('Add more assets'))) {
            // console.log('span内テキストで「Add assets」ボタンを発見、削除します');
            const button = span.closest('button');
            if (button && button.parentNode) {
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        });

        // ダイアログ内のボタンをチェック
        document.querySelectorAll('.ReactModal__Content button, [role="dialog"] button, .dialog button').forEach(button => {
          if (button.textContent && (button.textContent.includes('Add new assets') ||
            button.textContent.includes('Add more assets'))) {
            if (button.parentNode) {
              // console.log('ダイアログ内の「Add assets」ボタンを削除します');
              button.parentNode.removeChild(button);
              found = true;
            }
          }
        });

        if (found) {
          clearInterval(removeInterval);
        }
      }, 1000);

      // 10秒後に実行を停止
      setTimeout(() => clearInterval(removeInterval), 10000);
    };

    // 独自のアップロードインターフェースを作成
    const createCustomUploadInterface = () => {
      // 既存のカスタムインターフェースがあれば削除
      const existingInterface = document.getElementById('standalone-upload-interface');
      if (existingInterface) {
        document.body.removeChild(existingInterface);
      }

      // iframeを使って完全に分離された環境を作成
      const iframe = document.createElement('iframe');
      iframe.id = 'standalone-upload-interface';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.backgroundColor = 'rgba(33, 33, 52, 0.7)';
      iframe.style.zIndex = '2147483647'; // 最大値

      document.body.appendChild(iframe);

      // iframeのコンテンツを設定
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
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: rgba(33, 33, 52, 0.7);
            }
            .upload-container {
              background-color: white;
              border-radius: 4px;
              box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
              width: 600px;
              max-width: 90%;
              overflow: hidden;
            }
            .upload-header {
              padding: 24px 24px 10px 24px;
              border-bottom: 1px solid #f0f0f0;
            }
            .upload-header h2 {
              margin: 0;
              font-size: 1.5rem;
              color: #32324d;
              font-weight: 600;
            }
            .upload-body {
              padding: 20px 24px;
              max-height: 70vh;
              overflow-y: auto;
            }
            .upload-footer {
              padding: 16px 24px;
              border-top: 1px solid #f0f0f0;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
            .file-input-container {
              border: 2px dashed #dcdce4;
              border-radius: 4px;
              padding: 40px 20px;
              text-align: center;
              margin-bottom: 20px;
              cursor: pointer;
            }
            .file-input-container:hover {
              border-color: #4945ff;
            }
            .file-input {
              display: none;
            }
            .button {
              padding: 8px 16px;
              border-radius: 4px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }
            .primary-button {
              background-color: #4945ff;
              color: white;
            }
            .secondary-button {
              background-color: white;
              border: 1px solid #dcdce4;
              color: #32324d;
            }
            .file-list {
              margin-top: 20px;
              max-height: 200px;
              overflow-y: auto;
            }
            .file-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 12px;
              background-color: #f6f6f9;
              border-radius: 4px;
              margin-bottom: 4px;
            }
            .file-item-name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .file-item-remove {
              cursor: pointer;
              color: #d02b20;
              margin-left: 8px;
            }
            .upload-progress {
              margin-top: 20px;
              display: none;
            }
            .progress-bar {
              height: 4px;
              background-color: #dcdce4;
              border-radius: 2px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background-color: #4945ff;
              width: 0%;
              transition: width 0.3s;
            }
            .error-message {
              color: #d02b20;
              margin-top: 8px;
              font-size: 14px;
            }
            .success-message {
              color: #2da44e;
              margin-top: 8px;
              font-size: 14px;
            }
            .existing-file-alert {
              background-color: #fdf4f3;
              border: 1px solid #fae2e0;
              border-left: 4px solid #d02b20;
              padding: 12px;
              margin-top: 20px;
              border-radius: 4px;
            }
            .existing-file-message {
              color: #32324d;
              margin-bottom: 16px;
            }
            .existing-file-list {
              list-style-type: none;
              padding: 0;
              margin: 0;
            }
            .existing-file-item {
              background-color: #f6f6f9;
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
              font-size: 14px;
              line-height: 1.5;
            }
            .warning-icon {
              margin-right: 8px;
              font-size: 16px;
            }
            .hidden {
              display: none;
            }
            .warning-text {
              color: #d02b20;
              font-weight: 900;
            }
          </style>
        </head>
        <body>
          <div class="upload-container">
            <div class="upload-header">
              <h2>ファイルアップロード</h2>
            </div>
            <div class="upload-body">
              <div class="file-input-container" id="dropZone">
                <p>ファイルをドラッグ＆ドロップするか、クリックして選択してください</p>
                <input type="file" class="file-input" id="fileInput" multiple>
              </div>

              <div id="fileList" class="file-list"></div>

              <div id="uploadProgress" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill"></div>
                </div>
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
            // ドラッグ&ドロップの設定
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

            // 初期状態では無効化
            uploadButton.disabled = true;

            // ドロップゾーンクリックでファイル選択ダイアログを開く
            dropZone.addEventListener('click', () => {
              fileInput.click();
            });

            // ドラッグ&ドロップイベントの制御
            dropZone.addEventListener('dragover', (e) => {
              e.preventDefault();
              dropZone.style.borderColor = '#4945ff';
            });

            dropZone.addEventListener('dragleave', () => {
              dropZone.style.borderColor = '#dcdce4';
            });

            dropZone.addEventListener('drop', (e) => {
              e.preventDefault();
              dropZone.style.borderColor = '#dcdce4';

              if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
              }
            });

            // ファイル選択時の処理
            fileInput.addEventListener('change', () => {
              handleFiles(fileInput.files);
              fileInput.value = ''; // リセット
            });

            // ファイル処理関数
            function handleFiles(files) {
              for (const file of files) {
                if (!selectedFiles.some(f => f.name === file.name)) {
                  selectedFiles.push(file);
                  addFileToList(file);
                }
              }

              if (selectedFiles.length > 0) {
                uploadButton.disabled = false;
              }
            }

            // ファイルリストにファイルを追加
            function addFileToList(file) {
              const fileItem = document.createElement('div');
              fileItem.className = 'file-item';

              const fileName = document.createElement('span');
              fileName.className = 'file-item-name';
              fileName.textContent = file.name;

              const fileSize = document.createElement('span');
              fileSize.textContent = formatFileSize(file.size);

              const removeButton = document.createElement('span');
              removeButton.className = 'file-item-remove';
              removeButton.textContent = '×';
              removeButton.onclick = () => {
                fileItem.remove();
                selectedFiles = selectedFiles.filter(f => f !== file);

                if (selectedFiles.length === 0) {
                  uploadButton.disabled = true;
                }
              };

              fileItem.appendChild(fileName);
              fileItem.appendChild(fileSize);
              fileItem.appendChild(removeButton);

              fileList.appendChild(fileItem);
            }

            // ファイルサイズをフォーマット
            function formatFileSize(bytes) {
              if (bytes === 0) return '0 Bytes';

              const k = 1024;
              const sizes = ['Bytes', 'KB', 'MB', 'GB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));

              return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
            }

            // 日付をフォーマットする関数
            function formatDateToJST(dateString) {
              const date = new Date(dateString);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return \`\${year}/\${month}/\${day} \${hours}:\${minutes}:\${seconds}\`;
            }

            // アップロードボタンクリック時の処理
            uploadButton.addEventListener('click', async () => {
              if (selectedFiles.length === 0) return;

              try {
                // すでに「このままアップロード」ボタンになっている場合は強制アップロード
                if (uploadButton.textContent === 'このままアップロード') {
                  forceUpload = true;
                  existingFileAlert.classList.add('hidden');
                }

                // 既存ファイルチェック (forceUploadがtrueの場合はスキップ)
                if (!forceUpload) {
                  const existingFilesResult = await checkExistingFiles();

                  if (existingFilesResult.length > 0) {
                    existingFiles = existingFilesResult;
                    displayExistingFiles(existingFiles);
                    existingFileAlert.classList.remove('hidden');
                    // ボタンのテキストを変更
                    uploadButton.textContent = 'このままアップロード';
                    return; // ここでreturnすると処理が中断される
                  }
                }

                // アップロード処理
                uploadProgress.style.display = 'block';
                uploadButton.disabled = true;
                errorMessage.textContent = '';
                successMessage.textContent = '';

                await uploadFiles();

                successMessage.textContent = 'ファイルが正常にアップロードされました';
                setTimeout(() => {
                  // 親ウィンドウに完了を通知
                  window.parent.postMessage({ type: 'UPLOAD_COMPLETE', success: true }, '*');
                }, 1000);

              } catch (error) {
                errorMessage.textContent = 'アップロード中にエラーが発生しました: ' + error.message;
                uploadButton.disabled = false;
              }
            });

            // 既存ファイルの詳細情報を表示する関数
            function displayExistingFiles(files) {
              // 既存のリストをクリア
              existingFileList.innerHTML = '';

              // 各ファイルの詳細情報を表示
              files.forEach(file => {
                const updateDate = formatDateToJST(file.updatedAt);
                const updater = file.updatedBy ?
                  \`\${file.updatedBy.lastname} \${file.updatedBy.firstname}\` : '不明';
                const fileSize = formatFileSize(file.size || 0);

                const listItem = document.createElement('li');
                listItem.className = 'existing-file-item';
                listItem.innerHTML = \`ファイル名: \${file.name} <br />最終更新日時: \${updateDate} <br />最終更新者: \${updater} <br />ファイルサイズ: \${fileSize}\`;

                existingFileList.appendChild(listItem);
              });

              // ボタンテキストを変更
              uploadButton.textContent = 'このままアップロード';
            }

            // キャンセルボタンクリック時の処理
            cancelButton.addEventListener('click', () => {
              // 親ウィンドウに通知
              window.parent.postMessage({ type: 'UPLOAD_CANCELLED' }, '*');
            });

            // 既存ファイルチェック
            async function checkExistingFiles() {
              try {
                // 親ウィンドウからトークンを取得
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

                // ファイル名リスト作成
                const fileNames = selectedFiles.map(file => file.name);

                // クエリパラメータ構築
                const queryParams = new URLSearchParams();
                fileNames.forEach((name, index) => {
                  queryParams.append(\`filters[name][\$in][\${index}]\`, name);
                });
                queryParams.append('populate', '*');
                // ソート順を更新日時の降順に設定
                queryParams.append('sort', 'updatedAt:desc');

                // API呼び出し
                const response = await fetch(\`\${window.location.origin}/upload/files?\${queryParams.toString()}\`, {
                  method: 'GET',
                  headers: {
                    'Authorization': \`Bearer \${token}\`,
                    'Content-Type': 'application/json'
                  }
                });

                if (!response.ok) throw new Error(\`API エラー: \${response.status}\`);

                const data = await response.json();
                const allFiles = data.results || data || [];

                // 同じファイル名のものは最新のファイルだけを残す
                const latestFiles = [];
                const processedFileNames = new Set();

                // updatedAtの降順でソート済みのため、各ファイル名で最初に見つかったもの（最新のもの）だけを追加
                allFiles.forEach(file => {
                  if (!processedFileNames.has(file.name)) {
                    processedFileNames.add(file.name);
                    latestFiles.push(file);
                  }
                });

                return latestFiles;

              } catch (error) {
                console.error('既存ファイルチェックエラー:', error);
                return [];
              }
            }

            // ファイルアップロード関数
            async function uploadFiles() {
              try {
                // 親ウィンドウからトークンを取得
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

                // FormDataを作成
                const formData = new FormData();
                selectedFiles.forEach(file => {
                  formData.append('files', file);
                });

                // XMLHttpRequestでアップロード (プログレス表示のため)
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
                      reject(new Error(\`HTTP エラー: \${xhr.status}\`));
                    }
                  });

                  xhr.addEventListener('error', () => {
                    reject(new Error('ネットワークエラーが発生しました'));
                  });

                  xhr.open('POST', \`\${window.location.origin}/upload\`);
                  xhr.setRequestHeader('Authorization', \`Bearer \${token}\`);
                  xhr.send(formData);
                });
              } catch (error) {
                console.error('アップロードエラー:', error);
                throw error;
              }
            }

            // 親ウィンドウからのメッセージリスナー
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

      // iframe内からのメッセージを処理
      window.addEventListener('message', (event) => {
        if (event.data.type === 'GET_AUTH_TOKEN') {
          // トークンを取得して返信
          const token = getAuthTokenFromSessionStorage();
          if (token) {
            event.source.postMessage({ type: 'AUTH_TOKEN_RESPONSE', token }, '*');
          }
        } else if (event.data.type === 'UPLOAD_CANCELLED') {
          // アップロードキャンセル時
          document.body.removeChild(iframe);
        } else if (event.data.type === 'UPLOAD_COMPLETE') {
          // アップロード完了時
          document.body.removeChild(iframe);

          // ページ全体をリロード
          console.log('アップロード完了 - ページをリロードします');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      });

      return iframe;
    };

    // 「Add new folder」の隣に「Upload」ボタンを追加する処理
    const addUploadButtonNextToAddNewFolder = () => {
      // console.log('「Add new folder」の隣に「Upload」ボタンを追加する処理を開始します');

      // 既にアップロードボタンが追加されている場合は何もしない
      if (uploadButtonAdded) {
        // console.log('「Upload」ボタンはすでに追加されています');
        return;
      }

      // 「Add new folder」ボタンを見つける複数の方法
      const findAddNewFolderButton = () => {
        // console.log('「Add new folder」ボタンを検索中...');

        // 方法1: spanテキストで検索
        const spanElements = document.querySelectorAll('button span');
        for (const span of spanElements) {
          if (span.textContent && span.textContent.includes('Add new folder')) {
            // console.log('方法1: spanテキストで「Add new folder」ボタンを発見');
            return span.closest('button');
          }
        }

        // 方法2: ボタンテキストで直接検索
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent && button.textContent.includes('Add new folder')) {
            // console.log('方法2: ボタンテキストで「Add new folder」ボタンを発見');
            return button;
          }
        }

        // 方法3: フォルダアイコンを持つボタンを探す
        const svgButtons = document.querySelectorAll('button svg');
        for (const svg of svgButtons) {
          const button = svg.closest('button');
          if (button && button.offsetParent !== null) {
            // ボタンのaria-labelやtitleをチェック
            const ariaLabel = button.getAttribute('aria-label') || '';
            const title = button.getAttribute('title') || '';
            if (ariaLabel.includes('folder') || title.includes('folder')) {
              // console.log('方法3: SVGアイコン付きフォルダボタンを発見');
              return button;
            }
          }
        }

        // 方法4: ツールバー内のボタンを探す
        const toolbars = document.querySelectorAll('[data-testid="media-library-main-actions"], .media-library-actions');
        if (toolbars.length > 0) {
          // console.log('方法4: メディアライブラリのツールバーを発見');
          // ツールバー内のボタンを取得
          const toolbarButtons = toolbars[0].querySelectorAll('button');
          if (toolbarButtons.length > 0) {
            return toolbarButtons[toolbarButtons.length - 1]; // 最後のボタンを使用
          }
        }

        // 方法5: ヘッダーセクションを探す
        const headers = document.querySelectorAll('header, [role="region"], [class*="header"]');
        for (const header of headers) {
          const headerButtons = header.querySelectorAll('button');
          if (headerButtons.length > 0) {
            // console.log('方法5: ヘッダー内のボタンを発見');
            return headerButtons[headerButtons.length - 1];
          }
        }

        return null;
      };

      // 「Upload」ボタンを作成する関数
      const createUploadButton = () => {
        const uploadButton = document.createElement('button');
        uploadButton.id = 'custom-upload-button';
        uploadButton.textContent = 'Upload';

        // スタイルを設定
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

        // クリックイベント
        uploadButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          createCustomUploadInterface();
        });

        return uploadButton;
      };

      // ボタン追加処理を実行
      const addButtons = () => {
        const folderButton = findAddNewFolderButton();
        if (folderButton) {
          // console.log('「Add new folder」ボタンが見つかりました、「Upload」ボタンを追加します');

          // 既存のアップロードボタンをチェック
          if (document.getElementById('custom-upload-button')) {
            // console.log('カスタムアップロードボタンは既に存在します');
            uploadButtonAdded = true;
            return true;
          }

          // 「Upload」ボタンを作成
          const uploadButton = createUploadButton();

          // 「Add new folder」の隣に配置
          const parentElement = folderButton.parentElement;
          if (parentElement) {
            parentElement.insertBefore(uploadButton, folderButton.nextSibling);
            // console.log('「Upload」ボタンを追加しました');
            uploadButtonAdded = true;
            return true;
          }
        } else {
          // console.log('「Add new folder」ボタンが見つかりませんでした');
        }

        return false;
      };

      // 定期的にボタン追加を試行
      let attempts = 0;
      const maxAttempts = 20; // 最大20回試行

      const addButtonInterval = setInterval(() => {
        attempts++;
        // console.log(`「Upload」ボタン追加を試行 (${attempts}/${maxAttempts})...`);

        if (addButtons() || attempts >= maxAttempts) {
          clearInterval(addButtonInterval);

          if (attempts >= maxAttempts && !uploadButtonAdded) {
            // console.log('「Add new folder」ボタンの隣にボタンを追加できませんでした。フローティングボタンを追加します。');
            addFloatingActionButton();
          }
        }
      }, 1000);

      // ページの変更を監視して、ボタンが消えた場合に再追加
      const observer = new MutationObserver((mutations) => {
        if (uploadButtonAdded && !document.getElementById('custom-upload-button')) {
          // console.log('「Upload」ボタンが削除されたため、再度追加を試行します');
          uploadButtonAdded = false;
          addButtons();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    };

    // バックアップとしてフローティングアクションボタンを追加する関数
    const addFloatingActionButton = () => {
      // 既存のボタンがあれば削除
      const existingFAB = document.getElementById('custom-upload-fab');
      if (existingFAB) {
        document.body.removeChild(existingFAB);
      }

      // フローティングアクションボタンを作成
      const fab = document.createElement('button');
      fab.id = 'custom-upload-fab';
      fab.innerHTML = '<strong>+</strong>';
      fab.title = 'ファイルをアップロード';

      // スタイル設定
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

      // ホバー効果
      fab.addEventListener('mouseenter', () => {
        fab.style.backgroundColor = '#3c3adb';
      });

      fab.addEventListener('mouseleave', () => {
        fab.style.backgroundColor = '#4945ff';
      });

      // クリックイベント
      fab.addEventListener('click', () => {
        createCustomUploadInterface();
      });

      // ドキュメントに追加
      // document.body.appendChild(fab);
      // console.log('フローティングアクションボタンを追加しました');

      return fab;
    };

    // ここで作成したカスタムファイルアップロード機能の実装を開始
    setupConfirmOverride();
    hideOriginalAddNewAssetsButton(); // 「Add new assets」と「Add more assets」ボタンを非表示に
    removeAddNewAssetsButton(); // 強制的に削除も試みる
    addUploadButtonNextToAddNewFolder(); // 「Add new folder」の隣に「Upload」ボタンを追加
    setupNavigationDetection(); // ページ遷移検出機能を追加

    // キーボードショートカット（Ctrl+Shift+U）でアップロードダイアログを開く
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        createCustomUploadInterface();
      }
    });

    // 初期化時に一度実行し、その後も定期的に「Add new assets」ボタンを非表示に
    setInterval(() => {
      hideOriginalAddNewAssetsButton();
    }, 3000);
  }
};
