// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { createContext, useState,useEffect } from 'react';
import { Grid } from '@cloudscape-design/components';
import {ChatDataCtx} from './common-components';
import {
 Container,
 Header,
 SpaceBetween,
 Box,
 Button,
 Spinner,
 ColumnLayout,
 ContentLayout,
 StatusIndicator,
 Alert,
} from "@cloudscape-design/components";
import ConversationsPanel from "./conversations";
import { useTranslation } from "react-i18next";
import ModelSettings from './chat-settings';

const Content=() =>{
    const [msgItems,setMsgItems] = useState([]);
    const [modelParams, setModelParams] = useState({});
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const {t} = useTranslation();
    const [alertopen, setAlertOpen] = useState(false);
    return(
      <ChatDataCtx.Provider value={{msgItems,setMsgItems,modelParams, setModelParams,loading,
      setLoading,conversations,setConversations,alertopen, setAlertOpen}}>
        <ModelSettings/>
        <ContentLayout
        header={
          <Header
            variant="h1"
          
          >
            {t("chatbot")}
          </Header>
        }
      >
        <SpaceBetween size="l">
        {alertopen&&<Alert statusIconAriaLabel="Error" dismissible 
            type="error">
            {t('connection_retrying')}
            </Alert>}

        <ConversationsPanel/>
        </SpaceBetween>
      </ContentLayout>
      </ChatDataCtx.Provider>

    )
}

export default Content;