import { Dialog } from '@strapi/design-system';

export default {
  bootstrap(app) {
    // アプリケーションが読み込まれた時に実行されるコード
    console.log('Strapi admin panel is loaded');

    // フラグを追加してボタンの重複追加を防止
    let customButtonAdded = false;

    // 少し遅延させて確実にDOM構造が構築された後に実行
    setTimeout(() => {
      setupUploadButtonObserver();
    }, 500);

    // Upload ボタンを非表示にし、カスタムボタンを追加するための監視設定
    function setupUploadButtonObserver() {
      console.log("setupUploadButtonObserver started");
      const observer = new MutationObserver((mutations) => {
        // 処理中のフラグを追加
        // if (customButtonAdded) return;

        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            const dialogExists = document.querySelector('div[role="dialog"] h2');
            if (dialogExists && dialogExists.textContent.includes('Add new assets')) {
              console.log("Dialog detected:", dialogExists.textContent);

              // カスタムボタンが既に存在するか確認
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

      // body全体の変更を監視
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      console.log("MutationObserver set up successfully");
    }

    // ダイアログから選択されたファイル名を取得する関数
    function getFileNamesFromDialog() {
      const fileNames = [];

      try {
        // 提供されたHTMLの構造からファイル名を取得
        // h2タグからファイル名を取得（title要素）
        const titleElements = document.querySelectorAll('div[role="dialog"] h2.sc-dkPtRN.jeJmAQ');

        titleElements.forEach(element => {
          const fileName = element.textContent.trim();
          if (fileName && !fileName.includes('Add new assets')) {
            fileNames.push(fileName);
          }
        });

        // 別のアプローチ: article要素内のh2要素を探す
        if (fileNames.length === 0) {
          const fileArticles = document.querySelectorAll('div[role="dialog"] article');
          fileArticles.forEach(article => {
            const titleElement = article.querySelector('h2[id$="-title"]');
            if (titleElement) {
              fileNames.push(titleElement.textContent.trim());
            }
          });
        }

        // さらにバックアップ方法
        if (fileNames.length === 0) {
          // SVGのaria-labelからファイル名を取得
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


    function createCustomDialog(fileNames) {
      // Strapi Design Systemのスタイルをまねたカスタムダイアログを作成
      const dialogOverlay = document.createElement('div');
      dialogOverlay.style.position = 'fixed';
      dialogOverlay.style.top = '0';
      dialogOverlay.style.left = '0';
      dialogOverlay.style.width = '100%';
      dialogOverlay.style.height = '100%';
      dialogOverlay.style.backgroundColor = 'rgba(33, 33, 52, 0.2)';
      dialogOverlay.style.zIndex = '1000';
      dialogOverlay.style.display = 'flex';
      dialogOverlay.style.alignItems = 'center';
      dialogOverlay.style.justifyContent = 'center';

      // ダイアログの内容
      const dialogContent = document.createElement('div');
      dialogContent.style.backgroundColor = 'white';
      dialogContent.style.borderRadius = '4px';
      dialogContent.style.boxShadow = '0px 2px 15px rgba(33, 33, 52, 0.1)';
      dialogContent.style.width = '50%';
      dialogContent.style.maxWidth = '600px';
      dialogContent.style.maxHeight = '90%';
      dialogContent.style.overflow = 'auto';
      dialogContent.style.padding = '0';

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

      // カスタム入力フィールドの例
      // const fieldGroup = document.createElement('div');
      // fieldGroup.style.marginBottom = '16px';
      //
      // const fieldLabel = document.createElement('label');
      // fieldLabel.textContent = 'アップロード先を選択:';
      // fieldLabel.style.display = 'block';
      // fieldLabel.style.marginBottom = '8px';
      // fieldLabel.style.fontWeight = '500';
      //
      // const fieldSelect = document.createElement('select');
      // fieldSelect.style.width = '100%';
      // fieldSelect.style.padding = '8px 12px';
      // fieldSelect.style.borderRadius = '4px';
      // fieldSelect.style.border = '1px solid #dcdce4';
      //
      // const options = ['デフォルト', 'サーバーA', 'サーバーB', 'クラウドストレージ'];
      // options.forEach(option => {
      //   const optionEl = document.createElement('option');
      //   optionEl.value = option;
      //   optionEl.textContent = option;
      //   fieldSelect.appendChild(optionEl);
      // });
      //
      // fieldGroup.appendChild(fieldLabel);
      // fieldGroup.appendChild(fieldSelect);
      // dialogBody.appendChild(fieldGroup);

      // ダイアログフッター
      const dialogFooter = document.createElement('div');
      dialogFooter.style.padding = '16px 24px 24px 24px';
      dialogFooter.style.display = 'flex';
      dialogFooter.style.justifyContent = 'flex-end';
      dialogFooter.style.gap = '8px';

      // キャンセルボタン
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'キャンセル';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.border = '1px solid #dcdce4';
      cancelButton.style.backgroundColor = 'white';
      cancelButton.style.cursor = 'pointer';
      cancelButton.onclick = () => {
        document.body.removeChild(dialogOverlay);
      };

      // 確認ボタン
      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'アップロード';
      confirmButton.style.padding = '8px 16px';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.border = 'none';
      confirmButton.style.backgroundColor = '#4945ff';
      confirmButton.style.color = 'white';
      confirmButton.style.cursor = 'pointer';
      confirmButton.onclick = () => {
        console.log('カスタムアップロードの実行', {
          files: fileNames,
          destination: fieldSelect.value
        });

        // ここに実際のアップロード処理を追加

        document.body.removeChild(dialogOverlay);

        // 必要に応じて成功メッセージを表示
       // alert(`${fileNames.length}ファイルを${fieldSelect.value}へアップロードしました`);
      };

      dialogFooter.appendChild(cancelButton);
      dialogFooter.appendChild(confirmButton);

      // ダイアログ要素を組み立て
      dialogContent.appendChild(dialogHeader);
      dialogContent.appendChild(dialogBody);
      dialogContent.appendChild(dialogFooter);
      dialogOverlay.appendChild(dialogContent);

      // ドキュメントに追加
      document.body.appendChild(dialogOverlay);
    }

    function replaceUploadButton() {
      // 既にカスタムボタンが追加されている場合は処理を中止
      // if (customButtonAdded) return;

      const buttons = document.querySelectorAll('button[type="submit"]');
      console.log("Found submit buttons:", buttons.length);

      for (const button of buttons) {
        const buttonText = button.textContent || button.innerText;
        console.log("Button text:", buttonText);

        if (buttonText.trim().startsWith('Upload')) {
          console.log('対象のボタンを発見:', buttonText);

          // 既にカスタムボタンが追加されていないか確認
          const parentElement = button.parentElement;
          if (parentElement.querySelector('[data-custom-upload="true"]')) {
            console.log('カスタムボタンはすでに存在します');
            return;
          }

          // 元のボタンのスタイルとプロパティを取得
          const originalButton = button;

          // 新しいボタン要素を作成
          const newButton = document.createElement('button');
          newButton.textContent = 'Upload'; // 任意のテキスト
          newButton.type = 'button'; // type="button"に変更
          newButton.setAttribute('data-custom-upload', 'true'); // カスタムボタンの識別子

          // 元のボタンのクラスをコピー
          originalButton.classList.forEach(className => {
            newButton.classList.add(className);
          });

          // 必要なスタイルをコピー
          newButton.style.cssText = originalButton.style.cssText;
          newButton.style.color = 'white'; // テキスト色を白に設定

          // イベントハンドラを追加
          newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('カスタムボタンがクリックされました');
            // ここに独自の処理を追加
            const fileNames = getFileNamesFromDialog();
            createCustomDialog(fileNames);
            // originalButton.click(); // 元のボタンのクリックイベントをトリガー
          });

          // 元のボタンを非表示にして新しいボタンを挿入
          originalButton.style.display = 'none';
          parentElement.insertBefore(newButton, originalButton);

          // フラグを設定して重複追加を防止
          customButtonAdded = true;

          console.log('カスタムボタンを追加しました');
          return; // 一つ追加したらループを抜ける
        }
      }
    }
  }
};
