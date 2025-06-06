import React from 'react';
import { useIntl } from 'react-intl';
// オリジナルの App コンポーネントをインポート
import OriginalApp from '@strapi/plugin-upload/admin/src/pages/App';

const CustomApp = (props) => {
  const { formatMessage } = useIntl();

  // オリジナルの App コンポーネントを拡張
  return (
    <div>
      <h1>{formatMessage({ id: 'カスタムメディアライブラリ' })}</h1>
      <OriginalApp {...props} />
    </div>
  );
};

export default CustomApp;
