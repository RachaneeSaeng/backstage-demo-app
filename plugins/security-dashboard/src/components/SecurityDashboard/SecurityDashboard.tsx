
    import { Content, Header, Page } from '@backstage/core-components';
    import { SecurityTable } from './SecurityTable';

    export const SecurityDashboard = () => (
      <Page themeId="SecurityDashboard">
        <Header title="Security Dashboard" subtitle="Monitor security tools and issues" />
        <Content>
          <SecurityTable />
        </Content>
      </Page>
    );