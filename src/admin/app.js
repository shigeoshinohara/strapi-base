export default {
  bootstrap(app) {

    let customButtonAdded = false;
    let originalConfirm = null;

    // window.confirmをオーバーライドして警告表示を防止
    function setupConfirmOverride() {
      originalConfirm = window.confirm;
      window.confirm = function(message) {
        if (message && message.includes('not been uploaded yet')) {
          console.log('Strapi警告ダイアログをブロックしました:', message);
          return true;
        }
        return originalConfirm.apply(this, arguments);
      };
    }

    function restoreConfirmFunction() {
      if (originalConfirm) {
        window.confirm = originalConfirm;
        originalConfirm = null;
      }
    }

    setupConfirmOverride();

    setTimeout(() => {
      setupUploadButtonObserver();
    }, 500);

    function setupUploadButtonObserver() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            const dialogExists = document.querySelector('div[role="dialog"] h2');
            if (dialogExists && dialogExists.textContent.includes('Add new assets')) {
              console.log("Dialog detected:", dialogExists.textContent);

              const existingCustomButton = document.querySelector('button[data-custom-upload="true"]');
              if (!existingCustomButton) {
                setTimeout(() => {
                  replaceUploadButton();
                }, 100);
              }
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    function getFileNamesFromDialog() {
      // 既存のコード（変更なし）
      const fileNames = [];

      try {
        const titleElements = document.querySelectorAll('div[role="dialog"] h2.sc-dkPtRN.jeJmAQ');

        titleElements.forEach(element => {
          const fileName = element.textContent.trim();
          if (fileName && !fileName.includes('Add new assets')) {
            fileNames.push(fileName);
          }
        });

        if (fileNames.length === 0) {
          const fileArticles = document.querySelectorAll('div[role="dialog"] article');
          fileArticles.forEach(article => {
            const titleElement = article.querySelector('h2[id$="-title"]');
            if (titleElement) {
              fileNames.push(titleElement.textContent.trim());
            }
          });
        }

        if (fileNames.length === 0) {
          const svgElements = document.querySelectorAll('div[role="dialog"] svg[aria-label]');
          svgElements.forEach(svg => {
            const fileName = svg.getAttribute('aria-label');
            if (fileName) {
              fileNames.push(fileName);
            }
          });
        }

        console.log('ダイアログから検出されたファイル:', fileNames);
      } catch (error) {
        console.error('ファイル名取得中にエラーが発生しました:', error);
      }

      return fileNames;
    }

    function disableOriginalDialog() {
      const originalDialog = document.querySelector('div[role="dialog"]');
      if (originalDialog) {
        originalDialog.setAttribute('data-disabled', 'true');

        const checkboxes = originalDialog.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            checkbox.checked = false;
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
          }
        });

        const preventOverlay = document.createElement('div');
        preventOverlay.className = 'prevent-events-overlay';
        preventOverlay.style.position = 'absolute';
        preventOverlay.style.top = '0';
        preventOverlay.style.left = '0';
        preventOverlay.style.width = '100%';
        preventOverlay.style.height = '100%';
        preventOverlay.style.zIndex = '9999';

        preventOverlay.addEventListener('click', e => {
          e.stopPropagation();
          e.preventDefault();
        }, true);

        originalDialog.style.position = 'relative';
        originalDialog.prepend(preventOverlay);
      }
    }

    function enableOriginalDialog() {
      const originalDialog = document.querySelector('div[role="dialog"][data-disabled="true"]');
      if (originalDialog) {
        originalDialog.removeAttribute('data-disabled');
        const overlay = originalDialog.querySelector('.prevent-events-overlay');
        if (overlay) {
          originalDialog.removeChild(overlay);
        }
      }
    }

    function closeOriginalDialog() {
      const closeButton = document.querySelector('div[role="dialog"] button[aria-label="Close the modal"], div[role="dialog"] button:has(span:contains("Close"))');
      if (closeButton) {
        closeButton.click();
        return true;
      }
      return false;
    }

    function createCustomDialog(fileNames) {

      // 確実に警告を回避するために確認ダイアログをオーバーライド
      setupConfirmOverride();

      // 元のダイアログを無効化（チェックボックスのリセットも行う）
      disableOriginalDialog();

      const dialogOverlay = document.createElement('div');
      dialogOverlay.id = 'custom-upload-dialog-overlay'; // IDを追加
      dialogOverlay.style.position = 'fixed';
      dialogOverlay.style.top = '0';
      dialogOverlay.style.left = '0';
      dialogOverlay.style.width = '100%';
      dialogOverlay.style.height = '100%';
      dialogOverlay.style.backgroundColor = 'rgba(33, 33, 52, 0.2)';
      dialogOverlay.style.zIndex = '99999'; // 最前面に表示
      dialogOverlay.style.display = 'flex';
      dialogOverlay.style.alignItems = 'center';
      dialogOverlay.style.justifyContent = 'center';

      // イベント伝播の制御を調整
      dialogOverlay.onclick = function(e) {
        if (e.target === dialogOverlay) {
          console.log('オーバーレイ背景がクリックされました');
          // 背景クリックのみ伝播を停止
          e.stopPropagation();
        }
      };

      const dialogContent = document.createElement('div');
      dialogContent.id = 'custom-upload-dialog-content'; // IDを追加
      dialogContent.style.backgroundColor = 'white';
      dialogContent.style.borderRadius = '4px';
      dialogContent.style.boxShadow = '0px 2px 15px rgba(33, 33, 52, 0.1)';
      dialogContent.style.width = '50%';
      dialogContent.style.maxWidth = '600px';
      dialogContent.style.maxHeight = '90%';
      dialogContent.style.overflow = 'auto';
      dialogContent.style.padding = '0';
      dialogContent.style.position = 'relative'; // 相対位置指定

      // ダイアログヘッダー
      const dialogHeader = document.createElement('div');
      dialogHeader.style.padding = '24px 24px 0 24px';
      dialogHeader.style.marginBottom = '8px';

      const dialogTitle = document.createElement('h2');
      dialogTitle.textContent = 'カスタムアップロード';
      dialogTitle.style.fontSize = '1.5rem';
      dialogTitle.style.fontWeight = '600';
      dialogTitle.style.color = '#32324d';

      dialogHeader.appendChild(dialogTitle);

      // ダイアログボディ
      const dialogBody = document.createElement('div');
      dialogBody.style.padding = '0 24px';

      // 選択されたファイル一覧
      const fileListTitle = document.createElement('p');
      fileListTitle.textContent = '選択されたファイル:';
      fileListTitle.style.fontWeight = '500';
      fileListTitle.style.marginBottom = '8px';

      const fileList = document.createElement('ul');
      fileList.style.listStyleType = 'none';
      fileList.style.padding = '0';
      fileList.style.margin = '0 0 16px 0';

      fileNames.forEach(fileName => {
        const fileItem = document.createElement('li');
        fileItem.textContent = fileName;
        fileItem.style.padding = '8px 12px';
        fileItem.style.backgroundColor = '#f6f6f9';
        fileItem.style.borderRadius = '4px';
        fileItem.style.marginBottom = '4px';

        fileList.appendChild(fileItem);
      });

      dialogBody.appendChild(fileListTitle);
      dialogBody.appendChild(fileList);

      // ダイアログフッター
      const dialogFooter = document.createElement('div');
      dialogFooter.style.padding = '16px 24px 24px 24px';
      dialogFooter.style.display = 'flex';
      dialogFooter.style.justifyContent = 'flex-end';
      dialogFooter.style.gap = '8px';

      // === ボタン実装の変更点: インライン関数ではなくaddEventListener使用 ===

      // キャンセルボタン
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'キャンセル';
      cancelButton.id = 'custom-upload-cancel-button'; // IDを追加
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.border = '1px solid #dcdce4';
      cancelButton.style.backgroundColor = 'white';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.position = 'relative'; // ボタン位置を相対指定
      cancelButton.style.zIndex = '100000'; // 高いz-indexを設定

      // アップロードボタン
      const uploadButton = document.createElement('button');
      uploadButton.textContent = 'このままアップロード';
      uploadButton.id = 'custom-upload-button'; // IDを追加
      uploadButton.style.padding = '8px 16px';
      uploadButton.style.borderRadius = '4px';
      uploadButton.style.border = 'none';
      uploadButton.style.backgroundColor = '#4945ff';
      uploadButton.style.color = 'white';
      uploadButton.style.cursor = 'pointer';
      uploadButton.style.position = 'relative'; // ボタン位置を相対指定
      uploadButton.style.zIndex = '100000'; // 高いz-indexを設定

      dialogFooter.appendChild(cancelButton);
      dialogFooter.appendChild(uploadButton);

      // ダイアログ要素を組み立て
      dialogContent.appendChild(dialogHeader);
      dialogContent.appendChild(dialogBody);
      dialogContent.appendChild(dialogFooter);
      dialogOverlay.appendChild(dialogContent);

      // ドキュメントに追加
      document.body.appendChild(dialogOverlay);


      // === イベントリスナーを要素追加の後に設定 ===
      cancelButton.addEventListener('click', function(e) {
        console.log('キャンセルボタンがクリックされました');
        e.stopPropagation();

        // ダイアログを閉じる
        if (document.body.contains(dialogOverlay)) {
          document.body.removeChild(dialogOverlay);
          console.log('カスタムダイアログを削除しました');
        }

        enableOriginalDialog();
        restoreConfirmFunction();
      });

      uploadButton.addEventListener('click', function(e) {
        console.log('アップロードボタンがクリックされました');
        e.stopPropagation();

        console.log('カスタムアップロードの実行:', fileNames);

        // ここにカスタムアップロード処理を追加
        // 例: fetchを使って独自のAPIエンドポイントにファイル情報を送信など

        // ダイアログを閉じる
        if (document.body.contains(dialogOverlay)) {
          document.body.removeChild(dialogOverlay);
          console.log('カスタムダイアログを削除しました');
        }

        // 元のダイアログを閉じる（警告表示を回避）
        setTimeout(() => {
          closeOriginalDialog();
          restoreConfirmFunction();
        }, 100);

        // 成功メッセージ
        setTimeout(() => {
          alert(`${fileNames.length}ファイルのカスタムアップロードが完了しました`);
        }, 300);
      });
    }

    function replaceUploadButton() {
     // if (customButtonAdded) return;

      const buttons = document.querySelectorAll('button[type="submit"]');
      console.log("Found submit buttons:", buttons.length);

      for (const button of buttons) {
        const buttonText = button.textContent || button.innerText;
        console.log("Button text:", buttonText);

        if (buttonText.trim().startsWith('Upload')) {
          console.log('対象のボタンを発見:', buttonText);

          const parentElement = button.parentElement;
          if (parentElement.querySelector('[data-custom-upload="true"]')) {
            console.log('カスタムボタンはすでに存在します');
            return;
          }

          const originalButton = button;

          const newButton = document.createElement('button');
          newButton.textContent = 'Upload';
          newButton.type = 'button';
          newButton.setAttribute('data-custom-upload', 'true');

          originalButton.classList.forEach(className => {
            newButton.classList.add(className);
          });

          newButton.style.cssText = originalButton.style.cssText;
          newButton.style.color = 'white';

          newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('カスタムアップロードボタンがクリックされました');

            const fileNames = getFileNamesFromDialog();
            if (fileNames && fileNames.length > 0) {
              createCustomDialog(fileNames);
            } else {
              alert('ファイルが選択されていません');
            }
          });

          originalButton.style.display = 'none';
          parentElement.insertBefore(newButton, originalButton);

          customButtonAdded = true;
          console.log('カスタムボタンを追加しました');
          return;
        }
      }
    }
  }
};
