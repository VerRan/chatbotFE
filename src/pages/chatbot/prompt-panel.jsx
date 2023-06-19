// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useEffect, useState, useContext } from "react";
import {
  FormField,
  Container,
  Grid,
  Textarea,
  SpaceBetween,
  Toggle,
  Input,
  Button,
  FileUpload,
  ExpandableSection,
  Select,
  ColumnLayout,
  Form,
} from "@cloudscape-design/components";

import { useChatData, generateUniqueId } from "./common-components";
import { useTranslation } from "react-i18next";
import { useAuthUserInfo, useAuthToken } from "../commons/use-auth";
import { models, embeddings } from "../../common/shared";
import { useLocalStorage } from "../../common/localStorage";
import { listDocIdx,uploadFile,uploadS3 } from "../commons/api-gateway";
import {params_local_storage_key} from "./common-components";

export const defaultModelParams = {
  temperature: 0.01,
  max_tokens: 2000,
  model_name: models[0].value,
  model_name_opt: models[0],
  use_qa: false,
  embedding_model_name: embeddings[0].value,
  embedding_model_name_opt: embeddings[0],
  obj_prefix:'ai-content/',
};

const ExpandableSettingPanel = () => {
  const { t } = useTranslation();
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key,
    null
  );
  const [selectedOption, setSelectedOption] = useState(
    localStoredParams?.model_name_opt || defaultModelParams.model_name_opt
  );
  const [embselectedOption, setembSelectedOption] = useState(
    localStoredParams?.embedding_model_name_opt ||
      defaultModelParams.embedding_model_name_opt
  );
  const [tokenSize, settokenSize] = useState(
    localStoredParams?.max_tokens || defaultModelParams.max_tokens
  );
  const [temperatureValue, setTempValue] = useState(
    localStoredParams?.temperature || defaultModelParams.temperature
  );
  const { modelParams, setModelParams } = useChatData();
  const [alldocs, setAlldocs] = useState([]);
  const [selectDoc, setSelectDoc] = useState(
    localStoredParams?.file_idx_opt || []
  );
  const [loadStatus, setLoadStatus] = useState('loading');
  const [uploadErrtxt, setUploadErr] = useState();
  const [files, setFiles] = useState([]);
  const token = useAuthToken();
  const authuser = useAuthUserInfo();
  const [loading, setLoading] = useState(false);
  const [uploadsuccess, setUploadSuccess] = useState(false);
  const [helperMsg, setHelperMsg] = useState("Upload pdf or txt file");


  const handleLoadItems = async ({ detail: { filteringText, firstPage, samePage } }) => {
    const headers = {
      Authorization: token.token,
    };
    setLoadStatus('loading');
    try {
        const data = await listDocIdx(headers);
        setAlldocs(data);
        setLoadStatus('finished');
      }catch(error){
        console.log(error);
        setLoadStatus('error');
      }
  }

  const handleUpload = () =>{
    setHelperMsg('');
    const headers = {
      Authorization: token.token,
      'Content-Type': 'multipart/form-data',
    };
    files.map( file =>{
      setLoading(true);
      if (modelParams.ak && modelParams.sk&&modelParams.obj_prefix
               && modelParams.s3_bucket && modelParams.s3_region){
        uploadS3(file,
          modelParams.s3_bucket,
          modelParams.obj_prefix,
          modelParams.s3_region,
          modelParams.ak,
          modelParams.sk
          ).then(()=>{
            setLoading(false);
            setUploadSuccess(true);
            setLocalStoredParams({
              ...localStoredParams,
              lastuploadedfilename: file.name,
              username: authuser.username,
            });
            setHelperMsg(prev => (prev+` Upload ${file.name} success`));
            setFiles([]);
          }).catch(error =>{
            console.log(error);
            setLoading(false);
            setUploadErr(`Upload ${file.name} error`);
            setFiles([]);
          })

      }else{
        const formData = new FormData();
        formData.append("file", file);
        // console.log(formData);
        uploadFile(file.name, formData, 
        headers,
          )
          .then((response) => {
            // console.log(response);
            setLoading(false);
            setUploadSuccess(true);
            setLocalStoredParams({
              ...localStoredParams,
              lastuploadedfilename: file.name,
              username: authuser.username,
            });
            setHelperMsg(prev => (prev+` Upload ${file.name} success`));
            setFiles([]);
          })
          .catch((error) => {
            console.log(error);
            setLoading(false);
            setUploadErr(`Upload ${file.name} error`);
            setFiles([]);
          });
      }
    })
  }

  useEffect(() => {
    setModelParams({ ...localStoredParams,
      max_tokens:localStoredParams?.max_tokens|| defaultModelParams.max_tokens,
      temperature:localStoredParams?.temperature || defaultModelParams.temperature,
      use_qa:localStoredParams?.use_qa ||defaultModelParams.use_qa,
      model_name:localStoredParams?.model_name||defaultModelParams.model_name,
      embedding_model_name:localStoredParams?.embedding_model_name||defaultModelParams.embedding_model_name,
      username: authuser.username });
  }, []);

  return (
    <ExpandableSection headerText={t('addtional_settings')} variant="footer">
      <ColumnLayout  borders="vertical" columns="3" variant="text-grid">
        <FormField label={t("model_name")}>
          <Select
            selectedOption={selectedOption}
            onChange={({ detail }) => {
              setSelectedOption(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                model_name: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                model_name: detail.selectedOption.value,
                model_name_opt: detail.selectedOption,
              });
            }}
            options={models}
            selectedAriaLabel="Selected"
          />
        </FormField>
        <FormField label={t("max_tokens")}>
          <Input
            onChange={({ detail }) => {
              settokenSize(detail.value);
              setModelParams((prev) => ({
                ...prev,
                max_tokens: parseInt(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                max_tokens: parseInt(detail.value),
              });
            }}
            value={tokenSize}
            inputMode="numeric"
          />
        </FormField>
        <FormField label={t("temperature")}>
          <Input
            onChange={({ detail }) => {
              setTempValue(detail.value);
              setModelParams((prev) => ({
                ...prev,
                temperature: parseFloat(detail.value),
              }));
              setLocalStoredParams({
                ...localStoredParams,
                temperature: parseFloat(detail.value),
              });
            }}
            value={temperatureValue}
            inputMode="decimal"
          />
        </FormField>
        
        {/* <FormField label={t("embedding_model_name")}>
          <Select
            selectedOption={embselectedOption}
            onChange={({ detail }) => {
              setembSelectedOption(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                embedding_model_name: detail.selectedOption.value,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                embedding_model_name: detail.selectedOption.value,
                embedding_model_name_opt: detail.selectedOption,
              });
            }}
            options={embeddings}
            selectedAriaLabel="Selected"
          />
        </FormField> */}
        </ColumnLayout>
        <ColumnLayout  borders="vertical" columns="2" variant="text-grid">
        {/* <FormField label={t("knowledge_index")}>
          <Select
           statusType = {loadStatus}
           onLoadItems={handleLoadItems}
            selectedOption={selectDoc}
            onChange={({ detail }) => {
              setSelectDoc(detail.selectedOption);
              setModelParams((prev) => ({
                ...prev,
                file_idx: detail.selectedOption.value,
                use_qa: true,
              }));
              setLocalStoredParams({
                ...localStoredParams,
                file_idx: detail.selectedOption.value,
                file_idx_opt: detail.selectedOption,
                use_qa: true,
              });
            }}
            options={alldocs.map(
              ({ filename, index_name, embedding_model }) => ({
                label: `${filename} /${embedding_model.toLowerCase()}`,
                value: index_name,
              })
            )}
            selectedAriaLabel="Selected"
          />
        </FormField> */}
        {/* <FormField label={t("use_qa")}>
          <Toggle
            onChange={({ detail }) => {
              setChecked(detail.checked);
              setModelParams((prev) => ({ ...prev, use_qa: detail.checked }));
              setLocalStoredParams({
                ...localStoredParams,
                use_qa: detail.checked,
              });
            }}
            checked={checked}
          />
        </FormField> */}
        <FormField label={t("upload_file")}>
        <SpaceBetween size="s" direction="horizontal" >

          <FileUpload
            onChange={({ detail }) =>{
              setHelperMsg('');
             setFiles(detail.value);
            //  console.log(detail.value);
             setUploadErr(null);
             }
             }
            value={files}
            accept='.pdf,.txt,.faq'
            multiple
            constraintText = {helperMsg}
            showFileLastModified
            showFileSize
            showFileThumbnail
            tokenLimit={3}
            errorText={uploadErrtxt}
            i18nStrings={{
          uploadButtonText: e =>
            e ? t("choose_files") : t("choose_file"),
          dropzoneText: e =>
            e
              ? "Drop files to upload"
              : "Drop file to upload",
          removeFileAriaLabel: e =>
            `Remove file ${e + 1}`,
          limitShowFewer: "Show fewer files",
          limitShowMore: "Show more files",
          errorIconAriaLabel: "Error"
        }}
          />
           <Button  variant="primary"
           loading  = {loading}
           onClick={handleUpload}
            >
              {t("upload")}
            </Button>
           </SpaceBetween>
        </FormField>
      </ColumnLayout>
    </ExpandableSection>
  );
};

const PromptPanel = ({ sendMessage }) => {
  const { t } = useTranslation();
  const userinfo = useAuthUserInfo();
  const [promptValue, setPromptValue] = useState("");
  const {
    modelParams,
    setMsgItems,
    setLoading,
    setModelParams,
    conversations,
    setConversations,
  } = useChatData();
  const [localStoredParams, setLocalStoredParams] = useLocalStorage(
    params_local_storage_key,
    null
  );
  const [checked, setChecked] = useState(
    localStoredParams?.use_qa || defaultModelParams.use_qa
  );

  const onSubmit = (values) => {
    const prompt = values.trimEnd();
    if (prompt === "") {
      return;
    }
    const respid = generateUniqueId();
    setMsgItems((prev) => [
      ...prev,
      { id: respid, who: userinfo.username, text: prompt },
    ]);

    setConversations((prev) => [...prev, { role: "user", content: prompt }]);
    const messages = [...conversations, { role: "user", content: prompt }];
    setLoading(true);
    sendMessage({
      action: "sendprompt",
      payload: { msgid: respid, messages: messages, params: modelParams },
    });
    setPromptValue("");
  };

  return (
    <Container footer={<ExpandableSettingPanel />}>
      <FormField
        stretch={true}
        // label={t('prompt_label')}
      >
        <Grid gridDefinition={[{ colspan: 8 }, { colspan: 2 },{ colspan: 2 }]}>
          <Textarea
            value={promptValue}
            onChange={(event) => setPromptValue(event.detail.value)}
            onKeyDown={(event) => {
              if (event.detail.key === "Enter" && event.detail.ctrlKey) {
                onSubmit(promptValue);
              }
            }}
            placeholder="Ctrl+Enter to send"
            autoFocus
            rows={3}
          />
          <SpaceBetween size="xs">
            <Button
              variant="primary"
              onClick={(event) => onSubmit(promptValue)}
            >
              {t("send")}
            </Button>
            <Button
              variant="secondary"
              onClick={(event) => {
                setPromptValue("");
                // setConversations((prev) => prev.slice(0,1));
                // setMsgItems((prev) => prev.slice(0,1));
                setConversations([]);
                setMsgItems([]);
                setLoading(false);
              }}
            >
              {t("clear")}
            </Button>
          </SpaceBetween>
          <FormField label={t("use_qa")}>
          <Toggle
            onChange={({ detail }) => {
              setChecked(detail.checked);
              setModelParams((prev) => ({ ...prev, use_qa: detail.checked }));
              setLocalStoredParams({
                ...localStoredParams,
                use_qa: detail.checked,
              });
            }}
            checked={checked}
          />
        </FormField>
        </Grid>
      </FormField>
    </Container>
  );
};
export default PromptPanel;