# 部署操作手册

## 1. 概述

本文档提供了AI驱动的产品碳足迹量化平台在阿里云容器服务(ACK)上的详细部署指南。内容覆盖环境准备、配置步骤、部署流程、监控设置和常见问题解决方案，适用于DevOps工程师和系统管理员。

## 2. 环境要求

### 2.1 阿里云账号和权限

- 阿里云账号具有以下服务的管理权限:
  - 容器服务Kubernetes版(ACK)
  - 专有网络VPC
  - 弹性计算服务ECS
  - 对象存储服务OSS
  - 容器镜像服务ACR
  - 云数据库RDS
  - 负载均衡SLB

### 2.2 基础设施需求

#### 2.2.1 Kubernetes集群要求

- **集群类型**: 托管版ACK
- **Kubernetes版本**: 1.24或更高
- **节点规格**:
  - 工作节点: 至少3个 ecs.g7.2xlarge(8vCPU, 32GB内存)
  - 可选AI节点: 1个 ecs.gn6i-c8g1.2xlarge(带NVIDIA GPU)
- **操作系统**: AliyunLinux 2.1903
- **网络插件**: Terway(推荐)或Flannel

#### 2.2.2 数据库和存储

- **RDS实例**:
  - 类型: PostgreSQL 14或更高
  - 规格: 至少4核16GB
  - 存储: 100GB SSD
- **Redis实例**:
  - 版本: 6.0或更高
  - 规格: 2GB内存(基础版)
- **OSS存储桶**:
  - 类型: 标准存储
  - 权限: 私有
  - 存储空间: 初始100GB
- **容器镜像仓库**:
  - ACR企业版或标准版
  - 命名空间: carbon-platform

## 3. 网络配置

### 3.1 VPC设置

1. **创建VPC**:

   ```
   名称: carbon-platform-vpc
   网段: 172.16.0.0/16
   ```

2. **创建交换机(Subnet)**:

   ```
   名称: carbon-platform-subnet-zone-a
   可用区: 华北2-可用区A
   网段: 172.16.1.0/24

   名称: carbon-platform-subnet-zone-b
   可用区: 华北2-可用区B
   网段: 172.16.2.0/24
   ```

### 3.2 安全组配置

1. **创建安全组**:

   ```
   名称: carbon-platform-sg
   类型: 普通安全组
   VPC: carbon-platform-vpc
   ```

2. **配置入站规则**:

   ```
   协议: TCP
   端口范围: 80,443
   授权对象: 0.0.0.0/0

   协议: TCP
   端口范围: 22
   授权对象: {维护团队IP}/32
   ```

## 4. Kubernetes集群创建和配置

### 4.1 创建ACK集群

1. 登录阿里云控制台，进入容器服务Kubernetes版
2. 点击"集群"->"创建集群"，选择"ACK托管版"
3. 配置集群基本参数:

   ```
   集群名称: carbon-platform-cluster
   地域: 华北2(北京)
   可用区: 可用区A, 可用区B
   VPC: carbon-platform-vpc
   网络插件: Terway
   安全组: carbon-platform-sg
   ```

4. 配置Worker节点:

   ```
   计费方式: 按量付费(测试)/包年包月(生产)
   实例规格: ecs.g7.2xlarge
   数量: 3
   系统盘: 100GB ESSD云盘
   登录方式: 密钥对
   ```

5. 组件配置:

   ```
   Ingress: 安装
   监控组件: 安装
   日志服务: 开启
   ```

6. 点击"创建集群"并等待完成(约15-20分钟)

### 4.2 配置kubectl访问

1. 在集群信息页面，点击"连接集群"
2. 配置kubectl:

   ```bash
   mkdir -p $HOME/.kube
   cp config $HOME/.kube/
   ```

3. 验证连接:
   ```bash
   kubectl get nodes
   ```

### 4.3 安装必要的集群插件

1. **安装Helm**:

   ```bash
   curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
   ```

2. **安装Ingress-Nginx控制器**:

   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm repo update
   helm install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx \
     --create-namespace \
     --set controller.service.annotations."service\.beta\.kubernetes\.io/alibaba-cloud-loadbalancer-spec"="slb.s2.small"
   ```

3. **安装Cert-Manager(SSL证书管理)**:
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm repo update
   helm install cert-manager jetstack/cert-manager \
     --namespace cert-manager \
     --create-namespace \
     --version v1.11.0 \
     --set installCRDs=true
   ```

## 5. 环境准备

### 5.1 创建命名空间

```bash
kubectl create namespace carbon-platform-prod
kubectl create namespace carbon-platform-stage
```

### 5.2 准备配置和密钥

1. **创建数据库密钥**:

   ```bash
   kubectl create secret generic db-credentials \
     --namespace carbon-platform-prod \
     --from-literal=username=carbon_admin \
     --from-literal=password=YOUR_SECURE_PASSWORD
   ```

2. **创建Redis密钥**:

   ```bash
   kubectl create secret generic redis-credentials \
     --namespace carbon-platform-prod \
     --from-literal=password=YOUR_REDIS_PASSWORD
   ```

3. **创建OSS访问密钥**:

   ```bash
   kubectl create secret generic oss-credentials \
     --namespace carbon-platform-prod \
     --from-literal=accesskey=YOUR_OSS_ACCESS_KEY \
     --from-literal=secretkey=YOUR_OSS_SECRET_KEY
   ```

4. **创建TLS证书密钥**(如使用自管理证书):
   ```bash
   kubectl create secret tls carbon-platform-tls \
     --namespace carbon-platform-prod \
     --cert=path/to/tls.crt \
     --key=path/to/tls.key
   ```

### 5.3 配置ConfigMap

创建主要配置:

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: carbon-platform-config
  namespace: carbon-platform-prod
data:
  NODE_ENV: "production"
  API_URL: "https://api.your-domain.com"
  OSS_BUCKET: "carbon-platform-prod"
  OSS_REGION: "oss-cn-beijing"
  DB_HOST: "rm-2ze123456789abcde.pg.rds.aliyuncs.com"
  DB_PORT: "5432"
  DB_NAME: "carbon_platform"
  REDIS_HOST: "r-2zc123456789abcde.redis.rds.aliyuncs.com"
  REDIS_PORT: "6379"
  LOG_LEVEL: "info"
EOF
```

## 6. 构建和推送Docker镜像

### 6.1 配置镜像仓库

1. 在阿里云容器镜像服务(ACR)创建命名空间:

   ```
   命名空间: carbon-platform
   自动创建仓库: 启用
   ```

2. 创建以下仓库:

   - carbon-platform/web-app
   - carbon-platform/api-service
   - carbon-platform/calculation-engine
   - carbon-platform/ai-service (可选)

3. 获取登录凭证:
   ```bash
   docker login --username=<your-username> registry.cn-beijing.aliyuncs.com
   ```

### 6.2 构建Docker镜像

1. **前端应用镜像**:

   ```bash
   cd /path/to/project
   docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/web-app:${VERSION} -f docker/web-app.Dockerfile .
   ```

2. **API服务镜像**:

   ```bash
   cd /path/to/project
   docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/api-service:${VERSION} -f docker/api-service.Dockerfile .
   ```

3. **计算引擎镜像**:

   ```bash
   cd /path/to/project
   docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine:${VERSION} -f docker/calculation-engine.Dockerfile .
   ```

4. **AI服务镜像**(可选):
   ```bash
   cd /path/to/project/ai-service
   docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/ai-service:${VERSION} .
   ```

### 6.3 推送镜像到ACR

```bash
docker push registry.cn-beijing.aliyuncs.com/carbon-platform/web-app:${VERSION}
docker push registry.cn-beijing.aliyuncs.com/carbon-platform/api-service:${VERSION}
docker push registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine:${VERSION}
docker push registry.cn-beijing.aliyuncs.com/carbon-platform/ai-service:${VERSION}
```

## 7. 部署应用

### 7.1 使用Helm Charts部署

1. **前端应用部署**:

   ```bash
   helm upgrade --install web-app ./charts/web-app \
     --namespace carbon-platform-prod \
     --set image.repository=registry.cn-beijing.aliyuncs.com/carbon-platform/web-app \
     --set image.tag=${VERSION} \
     --set replicaCount=2 \
     --set ingress.enabled=true \
     --set ingress.hosts[0].host=app.your-domain.com \
     --set ingress.tls[0].secretName=carbon-platform-tls \
     --set ingress.tls[0].hosts[0]=app.your-domain.com
   ```

2. **API服务部署**:

   ```bash
   helm upgrade --install api-service ./charts/api-service \
     --namespace carbon-platform-prod \
     --set image.repository=registry.cn-beijing.aliyuncs.com/carbon-platform/api-service \
     --set image.tag=${VERSION} \
     --set replicaCount=2 \
     --set ingress.enabled=true \
     --set ingress.hosts[0].host=api.your-domain.com \
     --set ingress.tls[0].secretName=carbon-platform-tls \
     --set ingress.tls[0].hosts[0]=api.your-domain.com \
     --set env.existingConfigMap=carbon-platform-config \
     --set secrets.db.existingSecret=db-credentials \
     --set secrets.redis.existingSecret=redis-credentials
   ```

3. **计算引擎部署**:

   ```bash
   helm upgrade --install calculation-engine ./charts/calculation-engine \
     --namespace carbon-platform-prod \
     --set image.repository=registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine \
     --set image.tag=${VERSION} \
     --set replicaCount=1 \
     --set env.existingConfigMap=carbon-platform-config \
     --set secrets.db.existingSecret=db-credentials \
     --set resources.requests.memory=4Gi \
     --set resources.requests.cpu=1000m
   ```

4. **AI服务部署**(可选):
   ```bash
   helm upgrade --install ai-service ./charts/ai-service \
     --namespace carbon-platform-prod \
     --set image.repository=registry.cn-beijing.aliyuncs.com/carbon-platform/ai-service \
     --set image.tag=${VERSION} \
     --set replicaCount=1 \
     --set env.existingConfigMap=carbon-platform-config \
     --set resources.requests.memory=4Gi \
     --set resources.requests.cpu=1000m
   ```

### 7.2 配置数据库初始化作业

```bash
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: carbon-platform-prod
spec:
  template:
    spec:
      containers:
      - name: db-migrate
        image: registry.cn-beijing.aliyuncs.com/carbon-platform/api-service:${VERSION}
        command: ["npm", "run", "db:migrate"]
        envFrom:
        - configMapRef:
            name: carbon-platform-config
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
      restartPolicy: Never
  backoffLimit: 4
EOF
```

### 7.3 验证部署状态

```bash
# 检查Pod状态
kubectl get pods -n carbon-platform-prod

# 检查服务状态
kubectl get svc -n carbon-platform-prod

# 检查Ingress配置
kubectl get ingress -n carbon-platform-prod

# 查看特定Pod的日志
kubectl logs -f -n carbon-platform-prod deploy/web-app
kubectl logs -f -n carbon-platform-prod deploy/api-service
```

## 8. 配置持续集成与部署(CI/CD)

### 8.1 使用阿里云流水线

1. 在阿里云容器服务控制台，进入"应用"->"流水线"
2. 创建新流水线:
   ```
   名称: carbon-platform-cicd
   代码来源: GitHub/码云
   构建设置:
     - 构建Web应用镜像
     - 构建API服务镜像
     - 构建计算引擎镜像
   部署设置:
     - 目标集群: carbon-platform-cluster
     - 命名空间: carbon-platform-prod
   ```

### 8.2 使用GitHub Actions(可选)

在项目根目录创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to ACK

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to ACR
        uses: aliyun/acr-login@v1
        with:
          login-server: registry.cn-beijing.aliyuncs.com
          username: ${{ secrets.ALIYUN_USERNAME }}
          password: ${{ secrets.ALIYUN_PASSWORD }}

      - name: Build and push images
        run: |
          # 设置版本
          VERSION=${GITHUB_REF_NAME/refs\/tags\//}
          if [[ "$VERSION" != v* ]]; then
            VERSION=latest
          fi

          # 构建镜像
          docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/web-app:${VERSION} -f docker/web-app.Dockerfile .
          docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/api-service:${VERSION} -f docker/api-service.Dockerfile .
          docker build -t registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine:${VERSION} -f docker/calculation-engine.Dockerfile .

          # 推送镜像
          docker push registry.cn-beijing.aliyuncs.com/carbon-platform/web-app:${VERSION}
          docker push registry.cn-beijing.aliyuncs.com/carbon-platform/api-service:${VERSION}
          docker push registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine:${VERSION}

      - name: Set up kubectl
        uses: aliyun/ack-set-context@v1
        with:
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
          cluster-id: ${{ secrets.ACK_CLUSTER_ID }}

      - name: Deploy to ACK
        run: |
          VERSION=${GITHUB_REF_NAME/refs\/tags\//}
          if [[ "$VERSION" != v* ]]; then
            VERSION=latest
          fi

          # 安装Helm
          curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash

          # 部署应用
          helm upgrade --install web-app ./charts/web-app \
            --namespace carbon-platform-prod \
            --set image.tag=${VERSION}
            
          helm upgrade --install api-service ./charts/api-service \
            --namespace carbon-platform-prod \
            --set image.tag=${VERSION}
            
          helm upgrade --install calculation-engine ./charts/calculation-engine \
            --namespace carbon-platform-prod \
            --set image.tag=${VERSION}
```

## 9. 监控和日志配置

### 9.1 配置Prometheus监控

1. **安装Prometheus和Grafana**:

   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update

   helm install prometheus prometheus-community/kube-prometheus-stack \
     --namespace monitoring \
     --create-namespace \
     --set prometheus.service.type=ClusterIP \
     --set grafana.service.type=ClusterIP \
     --set grafana.adminPassword=YOUR_SECURE_PASSWORD
   ```

2. **配置应用监控**:

   ```bash
   kubectl apply -f - <<EOF
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: carbon-platform
     namespace: monitoring
     labels:
       release: prometheus
   spec:
     selector:
       matchLabels:
         app.kubernetes.io/instance: api-service
     namespaceSelector:
       matchNames:
       - carbon-platform-prod
     endpoints:
     - port: http
       path: /metrics
       interval: 30s
   EOF
   ```

3. **配置Grafana仪表板**:
   - 使用端口转发访问Grafana:
     ```bash
     kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
     ```
   - 使用浏览器访问 http://localhost:3000 (用户名: admin, 密码: 之前设置的密码)
   - 导入预配置的仪表板或创建自定义仪表板

### 9.2 配置日志收集

1. **部署阿里云日志组件**:

   ```bash
   # 创建Logtail配置
   kubectl apply -f - <<EOF
   apiVersion: log.alibabacloud.com/v1alpha1
   kind: AliyunLogConfig
   metadata:
     name: carbon-platform-logs
     namespace: carbon-platform-prod
   spec:
     logstore: carbon-platform
     shardCount: 2
     lifeCycle: 30
     logtailConfig:
       inputType: file
       configName: carbon-platform-logs
       inputDetail:
         logPath: /app/logs
         filePattern: "*.log"
       outputType: LogService
       outputDetail:
         projectName: YOUR_LOG_PROJECT
         logstoreName: carbon-platform
   EOF
   ```

2. **启用应用日志收集**:
   为所有部署添加日志注解:

   ```bash
   kubectl patch deployment web-app -n carbon-platform-prod -p '{"spec":{"template":{"metadata":{"annotations":{"aliyun.logs.web-app":"/app/logs/*.log"}}}}}'
   kubectl patch deployment api-service -n carbon-platform-prod -p '{"spec":{"template":{"metadata":{"annotations":{"aliyun.logs.api-service":"/app/logs/*.log"}}}}}'
   kubectl patch deployment calculation-engine -n carbon-platform-prod -p '{"spec":{"template":{"metadata":{"annotations":{"aliyun.logs.calculation-engine":"/app/logs/*.log"}}}}}'
   ```

## 10. 备份和恢复

### 10.1 数据库备份

在阿里云RDS控制台:

1. 进入数据库实例 > 备份恢复
2. 配置自动备份:

   ```
   备份周期: 每天
   备份时间: 02:00-03:00
   保留时间: 7天
   ```

3. 手动备份:
   ```
   在"备份恢复"页面点击"数据备份" > "创建备份"
   备份方法: 物理备份
   备份策略: 实例备份
   ```

### 10.2 应用配置备份

使用kubectl导出所有配置资源:

```bash
mkdir -p backups/$(date +%Y%m%d)
kubectl get all,cm,secret,ingress -n carbon-platform-prod -o yaml > backups/$(date +%Y%m%d)/carbon-platform-backup.yaml
```

### 10.3 灾难恢复流程

1. **数据库恢复**:
   在阿里云RDS控制台:

   - 进入数据库实例 > 备份恢复
   - 选择"恢复" > "恢复到已有实例"
   - 选择备份时间点 > 确认恢复

2. **应用配置恢复**:

   ```bash
   kubectl apply -f backups/YYYYMMDD/carbon-platform-backup.yaml
   ```

3. **重新部署应用**:
   重复"部署应用"章节的Helm部署命令

## 11. 管理域名和证书

### 11.1 域名配置

在阿里云DNS控制台:

1. 选择你的域名
2. 添加以下解析记录:

   ```
   记录类型: CNAME
   主机记录: app
   记录值: <SLB外部IP>.xip.io
   TTL: 10分钟

   记录类型: CNAME
   主机记录: api
   记录值: <SLB外部IP>.xip.io
   TTL: 10分钟
   ```

### 11.2 证书管理

使用cert-manager自动管理证书:

```bash
# 创建Let's Encrypt签发者
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# 更新Ingress以使用自动证书
kubectl annotate ingress web-app -n carbon-platform-prod cert-manager.io/cluster-issuer=letsencrypt-prod
kubectl annotate ingress api-service -n carbon-platform-prod cert-manager.io/cluster-issuer=letsencrypt-prod
```

## 12. MVP部署简化指南

考虑到MVP阶段(Q3 2025)的特殊需求，以下是简化的部署流程:

### 12.1 MVP环境需求

- **单集群部署**: 使用更小规模的ACK集群

  ```
  集群规格: 3个 ecs.g6.xlarge(4vCPU, 16GB内存)
  ```

- **简化服务组合**:
  - Web应用(前端+API)整合在一个容器中
  - 计算引擎服务
  - 数据库服务(使用RDS)

### 12.2 MVP快速部署步骤

1. **创建精简集群**:

   ```bash
   aliyun cs CREATE \
     --name carbon-platform-mvp \
     --size 3 \
     --instance-type ecs.g6.xlarge \
     --vswitch-id vsw-xxxxxxxxxx \
     --password YOUR_PASSWORD
   ```

2. **部署组合式应用**:
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: carbon-platform-mvp
     namespace: default
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: carbon-platform-mvp
     template:
       metadata:
         labels:
           app: carbon-platform-mvp
       spec:
         containers:
         - name: web-app
           image: registry.cn-beijing.aliyuncs.com/carbon-platform/web-app:mvp
           ports:
           - containerPort: 3000
           env:
           - name: DB_HOST
             value: "rm-2ze123456789abcde.pg.rds.aliyuncs.com"
           - name: DB_PORT
             value: "5432"
           - name: DB_NAME
             value: "carbon_platform"
           - name: DB_USERNAME
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: username
           - name: DB_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: db-credentials
                 key: password
         - name: calculation-engine
           image: registry.cn-beijing.aliyuncs.com/carbon-platform/calculation-engine:mvp
           env:
           - name: API_BASE_URL
             value: "http://localhost:3000/api"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: carbon-platform-mvp
     namespace: default
   spec:
     selector:
       app: carbon-platform-mvp
     ports:
     - port: 80
       targetPort: 3000
     type: LoadBalancer
   EOF
   ```

## 13. 常见问题解决

### 13.1 部署失败问题

1. **镜像拉取失败**:

   - 检查ACR访问权限
   - 确认镜像名称和标签正确
   - 添加镜像拉取密钥:
     ```bash
     kubectl create secret docker-registry acr-auth \
       --docker-server=registry.cn-beijing.aliyuncs.com \
       --docker-username=<your-username> \
       --docker-password=<your-password> \
       --namespace carbon-platform-prod
     ```
   - 在部署中引用密钥:
     ```
     imagePullSecrets:
     - name: acr-auth
     ```

2. **Pod启动失败**:
   - 检查Pod事件和日志:
     ```bash
     kubectl describe pod <pod-name> -n carbon-platform-prod
     kubectl logs <pod-name> -n carbon-platform-prod
     ```
   - 常见原因:
     - 配置错误
     - 资源限制
     - 健康检查失败

### 13.2 网络问题

1. **服务不可访问**:

   - 检查Service配置:
     ```bash
     kubectl get svc -n carbon-platform-prod
     ```
   - 检查Ingress配置:
     ```bash
     kubectl get ingress -n carbon-platform-prod
     kubectl describe ingress <ingress-name> -n carbon-platform-prod
     ```
   - 验证DNS解析:
     ```bash
     nslookup app.your-domain.com
     ```

2. **服务间通信问题**:
   - 验证服务发现:
     ```bash
     kubectl run -it --rm debug --image=busybox -- sh
     # 从容器内部尝试访问服务
     wget -O- http://api-service.carbon-platform-prod.svc.cluster.local/health
     ```

### 13.3 性能问题

1. **应用响应缓慢**:
   - 检查资源使用情况:
     ```bash
     kubectl top pods -n carbon-platform-prod
     kubectl top nodes
     ```
   - 增加资源限制:
     ```bash
     kubectl scale deployment web-app --replicas=3 -n carbon-platform-prod
     ```
   - 调整资源请求和限制:
     ```bash
     kubectl patch deployment web-app -n carbon-platform-prod -p '{"spec":{"template":{"spec":{"containers":[{"name":"web-app","resources":{"requests":{"cpu":"1000m","memory":"2Gi"},"limits":{"cpu":"2000m","memory":"4Gi"}}}]}}}}'
     ```

## 14. 运维清单

### 14.1 定期维护任务

1. **检查集群状态**: 每日

   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces -o wide
   ```

2. **检查备份状态**: 每周

   - 验证RDS自动备份完成
   - 执行手动配置备份

3. **更新应用**: 根据发布计划

   ```bash
   helm upgrade web-app ./charts/web-app \
     --namespace carbon-platform-prod \
     --set image.tag=NEW_VERSION
   ```

4. **更新Kubernetes组件**: 每季度
   - 在阿里云控制台更新集群组件
   - 更新Helm charts依赖

### 14.2 监控检查清单

1. **性能指标**:

   - CPU和内存利用率
   - API响应时间
   - 数据库查询性能
   - 存储使用情况

2. **可用性指标**:

   - 服务健康状态
   - 实例运行状态
   - 请求成功率
   - 错误率

3. **业务指标**:
   - 活跃用户数
   - 计算任务数量
   - 数据处理量

## 15. 结论

本文档提供了AI驱动的产品碳足迹量化平台在阿里云容器服务上的完整部署指南。通过遵循这些步骤，运维团队可以成功部署、监控和维护平台的各个组件。对于MVP阶段，可以采用简化的部署策略，以加快上线和验证业务模式。

随着平台的成熟和用户数量的增加，可以逐步扩展基础设施，添加更多功能组件，并优化性能和可靠性。
