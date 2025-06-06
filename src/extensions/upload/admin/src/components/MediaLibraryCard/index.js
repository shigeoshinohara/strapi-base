import React from 'react';
import { useIntl } from 'react-intl';
// Strapi の UI コンポーネントをインポート
import { Card, CardBody, CardContent, CardTitle, CardSubtitle, CardBadge } from '@strapi/design-system';

// オリジナルのコンポーネントを拡張
const MediaLibraryCard = (props) => {
  const { formatMessage } = useIntl();

  // プロパティを展開
  const { name, mime, ext, size, ...rest } = props;

  return (
    <Card {...rest}>
      <CardBody>
        <CardContent>
          <CardTitle>{name}</CardTitle>
          <CardSubtitle>
            {mime} - {ext.toUpperCase()}
          </CardSubtitle>
          <CardBadge>
            {size} KB - カスタマイズ済み
          </CardBadge>
        </CardContent>
      </CardBody>
    </Card>
  );
};

export default MediaLibraryCard;
