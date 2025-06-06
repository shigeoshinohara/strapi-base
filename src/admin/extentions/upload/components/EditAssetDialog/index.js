import React from 'react';
import { EditAssetDialog as OriginalEditAssetDialog } from '@strapi/plugin-upload/admin/src/components/EditAssetDialog';

const EditAssetDialog = (props) => {
  console.log('カスタムEditAssetDialogがレンダリングされました', props);

  // 追加のカスタム機能をここに実装

  // 元のコンポーネントをカスタムプロップで拡張
  return <OriginalEditAssetDialog {...props} customProp="カスタム値" />;
};

export default EditAssetDialog;
