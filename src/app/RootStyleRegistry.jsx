    'use client';

    import React from 'react';
    import { AntdRegistry } from '@ant-design/nextjs-registry';

    const RootStyleRegistry = ({ children }) => (
      <AntdRegistry>{children}</AntdRegistry>
    );

    export default RootStyleRegistry;