import React from 'react';

import { Button, ModalFooter } from '@strapi/design-system';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

export const DialogFooter = ({ onClose, onValidate }) => {
  const { formatMessage } = useIntl();

  // 新しいハンドラを追加
  const handleValidate = () => {
    if (window.confirm(formatMessage({ id: 'upload.confirm', defaultMessage: 'ファイルをアップロードしますか？' }))) {
      onValidate?.();
    }
    // キャンセル時は何もしない
  };

  return (
    <div>TEST OVERRIDE</div>
    // <ModalFooter
    //   startActions={
    //     <Button onClick={onClose} variant="tertiary">
    //       {formatMessage({ id: 'app.components.Button.cancel', defaultMessage: 'Cancel' })}
    //     </Button>
    //   }
    //   endActions={
    //     onValidate && (
    //       <Button onClick={handleValidate}>
    //         {formatMessage({ id: 'global.finish', defaultMessage: 'Finish' })}
    //       </Button>
    //     )
    //   }
    // />
  );
};

DialogFooter.defaultProps = {
  onValidate: undefined,
};

DialogFooter.propTypes = {
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func,
};
