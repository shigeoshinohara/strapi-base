import React from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Typography,
  Button
} from '@strapi/design-system';
import { auth } from '@strapi/helper-plugin';

// 元のMediaLibraryコンポーネントをインポート
import { MediaLibrary as OriginalMediaLibrary } from '@strapi/plugin-upload/admin/src/components/MediaLibrary';

const MediaLibrary = (props) => {
  const { formatMessage } = useIntl();
  const { firstname } = auth.getUserInfo();

  return (
    <Box>
      <Box paddingBottom={4}>
        <Typography variant="beta">
          こんにちは、{firstname}さん！カスタマイズされたメディアライブラリへようこそ
        </Typography>
        <Button onClick={() => console.log('カスタムボタンがクリックされました')}>
          カスタム機能
        </Button>
      </Box>

      {/* 元のMediaLibraryコンポーネントをレンダリング */}
      <OriginalMediaLibrary {...props} />
    </Box>
  );
};

export default MediaLibrary;
