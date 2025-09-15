
    import { Content, Header, Page, ContentHeader } from '@backstage/core-components';
    import { Typography } from '@material-ui/core';

    export const SecurityDashboard = () => (
      <Page themeId="home">
        <Header title="My Custom Page">
          <ContentHeader title="Welcome to my custom content!" />
        </Header>
        <Content>
          <Typography variant="h5">This is a custom page in Backstage.</Typography>
          <Typography variant="body1">You can add any content and components here.</Typography>
        </Content>
      </Page>
    );